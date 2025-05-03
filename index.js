require('dotenv').config()
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const router = require('./router/index')
const errorMiddleware = require('./middlewares/error-middleware')

const PORT = process.env.PORT || 8000;
const app = express()

app.use(express.json());
app.use(cookieParser( ))
app.use(cors( {
    credentials: true,
    origin: process.env.CLIENT_URL,
}))
app.use('/api',router)
app.use(errorMiddleware)


const start = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(process.env.DB_URL, {});
        console.log('Connected to MongoDB');
        app.listen(PORT, ()=> console.log(`server started in PORT =  ${PORT}`)
        )
    } catch (e) {
        console.log(e);
        
    }
}
start()