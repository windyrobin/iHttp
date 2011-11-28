**Synopsis**

  Just a simplified version of http server , ONLY support "GET" method!

**Usage**
  
  User could use it like that:

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

**NOTE** :
  
  this's just an experiment , maybe there are some bugs,   
  if you want to use it in production ,you SHOULD consider it seriously...