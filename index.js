const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { Pool } = require('pg');
const fs=require('fs');
const app = express();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' +file.originalname);
    }
});
const upload = multer({ storage: storage });
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));//faltaba agregar esta linea de codigo
app.listen(3001, () => console.log('Server started'));

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'new',
    password: 'root',
    port: 5432,
    allowExitOnIdle: true
})
pool.connect((err) => {
    if (err) {
        console.log(err);
    }
    console.log("DB Connected");
});

app.post('/posts', upload.single('img'), async (req, res) => {
    try {
        const { description } = req.body;
        const img = req.file.path;
        const conecction=await pool.connect();
        const sql="Insert into post (url,description) values ($1,$2)"
        const values=[img,description]
        await conecction.query(sql,values);
        res.json({ message: 'Post created' });
        conecction.release();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong' });
    }
})

app.get('/posts', async (req, res) => {
    try {
        const conecction=await pool.connect();
        const sql="Select * from post"
        const result=await conecction.query(sql);
        res.json(result.rows);
        conecction.release();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong',error });
    }
})

// app.delete('/posts/:id', async (req, res) => {
//     try {
//         const {id}=req.params;
//         const conecction=await pool.connect();
//         const sql="Delete from post where id=$1"
//         const values=[id]
//         await conecction.query(sql,values);
//         res.json({ message: 'Post deleted' });
//         conecction.release();
//     } catch (error) {
//         console.log(error);
//         res.status(500).json({ message: 'Something went wrong',error });
//     }
// })

app.delete('/posts/:id', async (req, res) => {
    try {
        const {id}=req.params;
        const conecction=await pool.connect();
        //obtener la url la img del post que deseamos eliminar
        const {rows}=await conecction.query("Select url from post where id=$1",[id]);
        console.log(rows);
        if(rows.length===0){
          return res.status(404).json({message:"Post not found"}); 
        }
        const imgPath=rows[0].url;
        console.log(imgPath);
        //eliminar la img de la carpeta uploads
        fs.unlink(imgPath,async (err)=>{
            if(err){
                console.log(err);
                return res.status(500).json({message:"paso algo al eliminar la img"});
            }
            //eliminar el post de la bd
            const sql="Delete from post where id=$1"
            const values=[id]
            await conecction.query(sql,[id]);
            res.json({ message: 'Post deleted' });
        });
        conecction.release();
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Something went wrong',error });
    }
})








