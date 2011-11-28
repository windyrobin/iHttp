var net = require('net');
var cp = require('child_process');
var TCP = process.binding('tcp_wrap').TCP;

function main(fn){
  fn();
}

function debug(str){
  //console.log(str);
}

//var ADDRESS = '127.0.0.1';
var ADDRESS = '0.0.0.0';
var PORT = 3458;
var BACK_LOG = 128;

function IHttpServer(cb){
  this.connections = 0;
  this.maxConnections = null;

  //listen handle
  this._handle = null;
  this._cb = cb;
}

IHttpServer.prototype.listen = function(addr, port, backLog){
  addr = addr || ADDRESS;
  port = port || PORT;
  backLog = backLog || BACK_LOG;
  
  var handle = new TCP();
  handle.bind(addr, port);
  handle.onconnection = onconnection;
  
  handle.listen(backLog);

  handle.server = this;
  this._handle = handle;
}

IHttpServer.prototype._emitCloseIfDrained = function() {
  if (!this._handle && !this.connections) {
    this.emit('close');
  }
};

function onconnection(handle){
  var self = this.server;

  if(self.maxConnections && self.connections >= self.maxConnections){
    handle.close();
    return;
  }
  var socket = new net.Socket({
    handle : handle,
    allowHalfOpen : false 
  });
  socket.readable = socket.writable = true;
  socket.resume();
  self.connections++;
  socket.server = self;

  socket.setTimeout(2 * 60 * 1000); // 2 minute timeout
  socket.addListener('timeout', function() {
    socket.destroy();
  });
 
  debug('get a connection');

  socket.on('data', function(chunk){
    //buffers.push(chunk);
    //nread += chunk.length;
    self.genReqRes(socket, chunk);
  });

  socket.on('error', function(err){
    socket.destroy();
  });
}


function ServerResponse(sock){
  this.socket = sock;
}

var CRLF = '\r\n';
var STATUS_CODES = require('http').STATUS_CODES;

ServerResponse.prototype.writeHead = function(statusCode , headers){
  this._statusCode = statusCode;
  this._headers = headers;
}

ServerResponse.prototype.end = function(content){
  content = content || '';

  var statusCode = this._statusCode;
  var headers = this._headers;

  var reasonPhrase = STATUS_CODES[statusCode] || 'unknown';

  var headerString = 'HTTP/1.1 ' + statusCode.toString() + ' ' + reasonPhrase + CRLF;

  if(headers['content-length'] ==  null){
    headers['content-length'] = content.length;
  }
  
  for(var name in headers){
    headerString += (name + ': ' + headers[name] + CRLF);
  }

  headerString += CRLF;

  if(typeof(content) === 'string'){
    this.socket.write(headerString + content);
  }else{
    var fbuffer = new Buffer(headerString);
    var flen = Buffer.byteLength(fbuffer);
    var clen = Buffer.byteLength(content);

    var buffer = new Buffer(flen + clen);
    fbuffer.copy(buffer);
    content.copy(buffer, flen);

    this.socket.write(buffer);
  }
}

var HEADER_SEP = ':';

function ServerRequest(sock){
  this.socket = sock;

  //initial value
  this.method = '';
  this.path = '';
  this.version = '';
  this.headers = {};
}  

ServerRequest.prototype.parseHeader = function(buffer){
  debug('parseHeader');
  var lines = buffer.toString();
  lines = lines.trimRight().split(CRLF);

  var firstLine = lines.shift();
  
  var mvp = firstLine.trim();
  mvp = mvp.split(' ');
  this.method = mvp[0];
  this.path = mvp[1];
  this.version = mvp[2];

  var key, val;
  var kv;
  var hds = this.headers;
  for(var i = 0, len = lines.length; i < len; i++){
    kv = lines[i].split(HEADER_SEP);
    key = kv[0].trim();
    val = kv[1].trim();
    hds[key] = val;
  }
}

IHttpServer.prototype.genReqRes = function (sock, buffer){
  var res = new ServerResponse(sock);
  var req = new ServerRequest(sock);
  var isOK = false;

  //only GET method is supported
  try{
    req.parseHeader(buffer);
    if(req.method != 'GET'){
      debug('method not allowed' + req.method);
      //method not allowed
      res.writeHead(405);
      res.end();
    }else{
      isOK = true;
    }
  }catch(err){
    //bad request
    debug(err + 'bad request');
    res.writeHead(400);
    res.end();
  }
  
  if(isOK === true){
    this._cb.call(null, req, res);
  }
}

void main(function(){
 
  var server = new IHttpServer(function(req, res){
    //debug('method: ' + req.method);
    //debug('path: '  + req.path);
    //debug('version: ' + req.version);

    var content = 'hello,world';
    res.writeHead(200, {
      'content-type' : 'text/plain'
    });

    res.end(content);
  });
  
  server.listen(ADDRESS, PORT, BACK_LOG);

});
