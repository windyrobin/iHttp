####Synopsis

  Just a simplified version of http server , *ONLY* *"GET"* method supported!

####Usage
  
  You could use it like that:

```
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
```
  
####Benchmark
  Compared with Node's classic "hello,world" 
  
    siege -c 50 -r 10000 -b XXX:3459/

- origin :

    >Transaction rate:       9534.71 trans/sec
  
  
- iHttp :

    >Transaction rate:      11248.59 trans/sec

    
####NOTE
  
  This's just an experiment , maybe there are some bugs,   
if you want to use it in production ,you *SHOULD* consider it seriously...