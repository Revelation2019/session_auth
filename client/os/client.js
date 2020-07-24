const express = require('express')
const bodyParser = require('body-parser') // 用于解析请求参数
const cors = require('cors') // 允许跨域
const cookieParser = require("cookie-parser")
const session = require('express-session');
const RedisStrore = require('connect-redis')(session);
const redis = require('redis')

const config={
  "cookie" : {
    "path": "/",
    "maxAge" : 1800000,
    "httpOnly": true
  },
  "sessionStore" : {
    "host": "127.0.0.1",
    "port": "6379",
    "pass": "123456",
    "auth_pass": "123456",
    // "prefix": ""
  }
}
const client = redis.createClient(6379, '127.0.0.1', config.sessionStore)
const app = express()

const PORT = process.env.PORT || 1001

app.use(cors({
  origin: 'http://127.0.0.1:1000',
  allowedHeaders: [],
  credentials: true
}))

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(cookieParser())

app.use(session({
  name : "sessionId",
  secret : 'Asecret123-',
  resave : false,
  rolling: false, //在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false）
  saveUninitialized : false, // 强制将未初始化的 session 存储。当新建了一个 session 且未设定属性或值时，它就处于未初始化状态。在设定一个 cookie 前，这对于登陆验证，减轻服务端存储压力，权限控制是有帮助的。(默 认:true)。建议手动添加。
  cookie: config.cookie,
  store: new RedisStrore({ client })
}));

// 拦截器
app.all('*', function(req, res, next) {
  if (req.cookies.sessionId) {
    var sessionId = req.cookies.sessionId.split('.')[0].replace("s:", "sess:")
    console.log('sessionId', sessionId)
    client.get(sessionId, function(err, reply) {
      console.log('reply', reply)
      if (reply) {
        next();
      }
    })
  } else {
    console.log("=============重定向到SSO=============")
    res.json({
      code: 401
    })
  }
})

app.get('/getData', (req, res) => {
  res.json({
    code: 200,
    data: {
      msg: 'hello, welcome you!'
    }
  })
})

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) throw new ErrorEvent("注销失败")
    res.clearCookie("sessionId").json({
      code: 200
    })
  })
})

var server = app.listen(PORT, '127.0.0.1', () => {
  var host = server.address().address
  var port = server.address().port

  console.log('client server is listening at http://%s:%s', host, port)
})