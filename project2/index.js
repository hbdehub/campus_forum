const multer = require('multer');
const path = require('path');
const fs = require('fs');
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// JWT 认证中间件
function auth(req, res, next) {
  const raw = req.headers.authorization;
  if (!raw) {
    return res.status(401).json({ msg: "未登录，请先登录" });
  }
  const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;
  try {
    const decoded = jwt.verify(token, 'my_secret_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "token无效或已过期" });
  }
}
// 数据库连接配置（改成你自己MySQL账号密码）
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'hb1225hb1225',
  database: 'campus_forum',
  waitForConnections: true,
  connectionLimit: 10
});

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads', 'avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // 文件名：user_用户id_时间戳.png，避免重复
    cb(null, `user_${req.user.id}_${Date.now()}.png`);
  }
});
const upload = multer({ storage });


// 测试数据库连通接口
app.get('/db-test', async (req, res) => {
  try {
    const [result] = await pool.query('SELECT 1+1 AS num');
    res.send({msg:"数据库连接成功", data:result[0]});
  } catch (err) {
    res.status(500).send({msg:"数据库连接失败", error:err.message});
  }
});


// 注册接口 POST /register
app.post('/register', async (req, res) => {
  try {
    // 1. 接收前端传过来的 gender
    const { username, password, nickname, gender } = req.body;
    
    // 2. 检查用户名是否已存在
    const [existing] = await pool.query('SELECT id FROM `user` WHERE username=?', [username]);
    if(existing.length > 0){
      return res.status(409).send({msg:"用户名已被注册，请更换"});
    }
    
    // 3. 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashPwd = await bcrypt.hash(password, salt);
    
    // 4. 根据性别设置默认头像路径
    let defaultAvatar = '/uploads/avatars/default-avatar.png'; // 没选性别时的默认图
    if (gender === 'male') {
      defaultAvatar = '/uploads/avatars/default-boy.png'; // 对应男生图
    } else if (gender === 'female') {
      defaultAvatar = '/uploads/avatars/default-girl.png'; // 对应女生图
    }
    // 5. 插入数据库（加上 gender 和 avatar）
    const [result] = await pool.query(
      'INSERT INTO `user`(username, password, nickname, gender, avatar) VALUES (?,?,?,?,?)',
      [username, hashPwd, nickname, gender || 'male', defaultAvatar]
    );
    res.send({msg:"注册成功", userId: result.insertId});
  } catch(err){
    res.status(500).send({msg:"服务器错误", error:err.message})
  }
})


// 登录接口 POST /login
app.post('/login', async (req, res) => {
  try {
    const {username, password} = req.body;
    // 查询用户
    const [users] = await pool.query('SELECT * FROM `user` WHERE username=?',[username]);
    if(users.length === 0){
      return res.status(400).send({msg:"账号不存在"})
    }
    const user = users[0];
    // 比对密码
    const ok = await bcrypt.compare(password, user.password);
    if(!ok){
      return res.status(400).send({msg:"密码错误"})
    }
    
    // 生成jwt令牌 (只声明一次 token)
    const token = jwt.sign({id:user.id, username:user.username}, 'my_secret_key', {expiresIn:'24h'})
    
    // 返回给前端的数据
    res.send({
      msg: "登录成功", 
      token, 
      user: {
        id: user.id, 
        username: user.username, 
        nickname: user.nickname,
        avatar: user.avatar,  // 带上头像
        gender: user.gender   // 带上性别
      }
    })
  } catch(err){
    res.status(500).send({msg:"登录失败", error:err.message})
  }
})


// 上传头像（需要登录）
app.post('/upload-avatar', auth, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: '没有收到文件' });
    }
    // 数据库存相对路径，方便前端拼接
    const avatarPath = `/uploads/avatars/${req.file.filename}`;
    await pool.query('UPDATE `user` SET avatar = ? WHERE id = ?', [avatarPath, req.user.id]);
    res.json({ code: 200, msg: '上传成功', avatar: avatarPath });
  } catch (err) {
    res.status(500).json({ msg: '上传失败', error: err.message });
  }
});



// 接口3：帖子详情（无需登录）
app.get("/post/:id", async (req, res) => {
  const postId = req.params.id;

  try {
    const conn = await pool.getConnection();
    const [posts] = await conn.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.like_count, u.nickname 
      FROM post p 
      LEFT JOIN user u ON p.user_id = u.id 
      WHERE p.id = ?
    `, [postId]);
    conn.release();

    if (posts.length === 0) {
      return res.json({ code: 404, msg: "帖子不存在" });
    }
    res.json({ code: 200, data: posts[0] });
  } catch (err) {
    console.log("获取帖子详情失败:", err);
    res.json({ code: 500, msg: "获取失败" });
  }
});


// 发帖子（需要登录）
app.post("/post", auth, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.json({ code: 400, msg: "标题和内容不能为空" });
  }

  try {
    const conn = await pool.getConnection();
    const [result] = await conn.query(
      "INSERT INTO post (user_id, title, content) VALUES (?, ?, ?)",
      [req.user.id, title, content]
    );
    conn.release();
    res.json({ code: 200, msg: "发布成功", postId: result.insertId });
  } catch (err) {
    res.json({ code: 500, msg: "发布失败" });
  }
});


// 接口4：获取帖子列表（无需登录）
app.get("/posts", async (req, res) => {
  try {
    const [posts] = await pool.query(`
      SELECT p.id, p.title, p.content, p.created_at, p.like_count, p.comment_count, u.nickname 
      FROM post p 
      LEFT JOIN user u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `);
    res.json({ code: 200, data: posts });
  } catch (err) {
    console.log("获取列表报错：", err);
    res.json({ code: 500, msg: "获取失败" });
  }
});


// 接口5：发表评论（需要登录）
app.post("/comment", auth, async (req, res) => {
  const { postId, content } = req.body;
  if (!postId || !content) {
    return res.json({ code: 400, msg: "参数不完整" });
  }

  try {
    const conn = await pool.getConnection();
    // 先校验帖子是否存在
    const [posts] = await conn.query("SELECT id FROM post WHERE id = ?", [postId]);
    if (posts.length === 0) {
      conn.release();
      return res.json({ code: 404, msg: "帖子不存在" });
    }

    // 插入评论
    await conn.query(
      "INSERT INTO comment (post_id, user_id, content) VALUES (?, ?, ?)",
      [postId, req.user.id, content]
    );
    // 更新帖子评论数
    await conn.query("UPDATE post SET comment_count = comment_count + 1 WHERE id = ?", [postId]);
    conn.release();
    res.json({ code: 200, msg: "评论成功" });
  } catch (err) {
    res.json({ code: 500, msg: "评论失败" });
  }
});

// 接口6：获取帖子的评论列表（无需登录）
app.get("/comments/:postId", async (req, res) => {
  const postId = req.params.postId;

  try {
    const conn = await pool.getConnection();
    const [comments] = await conn.query(`
      SELECT c.id, c.content, c.created_at, u.nickname 
      FROM comment c 
      LEFT JOIN user u ON c.user_id = u.id 
      WHERE c.post_id = ? 
      ORDER BY c.created_at DESC
    `, [postId]);
    conn.release();

    res.json({ code: 200, data: comments });
  } catch (err) {
    res.json({ code: 500, msg: "获取失败" });
  }
});


// 接口7：点赞/取消点赞（需要登录）
app.post("/like", auth, async (req, res) => {
  const { postId } = req.body;
  const userId = req.user.id;

  try {
    const conn = await pool.getConnection();
    // 先查用户是否已经点赞
    const [likes] = await conn.query(
      "SELECT id FROM like_record WHERE post_id = ? AND user_id = ?",
      [postId, userId]
    );

    if (likes.length > 0) {
      // 已点赞 → 取消点赞
      await conn.query("DELETE FROM like_record WHERE post_id = ? AND user_id = ?", [postId, userId]);
      await conn.query("UPDATE post SET like_count = like_count - 1 WHERE id = ?", [postId]);
      res.json({ code: 200, msg: "取消点赞", liked: false });
    } else {
      // 未点赞 → 点赞
      await conn.query("INSERT INTO like_record (post_id, user_id) VALUES (?, ?)", [postId, userId]);
      await conn.query("UPDATE post SET like_count = like_count + 1 WHERE id = ?", [postId]);
      res.json({ code: 200, msg: "点赞成功", liked: true });
    }
    conn.release();
  } catch (err) {
    res.json({ code: 500, msg: "操作失败" });
  }
});

app.listen(port, () => {
  console.log(`校园论坛后端服务启动成功，端口：${port}`);
});
