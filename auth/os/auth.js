const express = require('express')
const bodyParser = require('body-parser') // 用于解析请求参数
const cors = require('cors') // 允许跨域
const nosql = require('nosql').load('user.nosql'); // 嵌入式数据库
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
    // "prefix": "s:" // 数据表前辍即schema, 默认为 "sess:"
  }
}
const PORT = process.env.PORT || 2001
const app = express()


app.use(cors({
  origin: 'http://127.0.0.1:2000',
  allowedHeaders: [],
  credentials: true
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 

app.use(session({
  name : "sessionId",
  secret : 'Asecret123-',
  resave : false,
  rolling: false, //在每次请求时强行设置 cookie，这将重置 cookie 过期时间（默认：false）
  saveUninitialized : false, // 强制将未初始化的 session 存储。当新建了一个 session 且未设定属性或值时，它就处于未初始化状态。在设定一个 cookie 前，这对于登陆验证，减轻服务端存储压力，权限控制是有帮助的。(默 认:true)。建议手动添加。
  cookie: config.cookie,
  store: new RedisStrore({client: redis.createClient(6379, '127.0.0.1', config.sessionStore)})
}));

app.post('/login', (req, res) => {
  var account = req.body.account
  var pwd = req.body.password
  if (!account || !pwd) {
    console.log("账户密码不能为空")
    return
  }
  nosql.one().make(builder => {
    builder.where('account', '=', account);
    builder.where('password', '=', pwd);

    builder.callback((err, userInfo) => {
      if (userInfo) {
        req.session.regenerate(err => {
          if (err) {
            console.log('生成sessionID失败: ' + err)
          } else {
            console.log(req)
            req.session.userInfo = userInfo
            req.session.save()
            // res.cookie("sessionId", req.sessionID, req.session.cookie)
            res.json({
              code: 200
            })
          }
        })
      } else {
        console.log("该账户不存在")
      }
    })
  })
})


var server = app.listen(PORT, '127.0.0.1', () => {
  var host = server.address().address
  var port = server.address().port

  console.log('client server is listening at http://%s:%s', host, port)
})