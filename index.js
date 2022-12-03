require('dotenv').config()
const express = require('express')
const sequelize = require('./db')
const models = require('./models/models')
const cors = require('cors')
const router = require('./routes/index')
const errorHandler = require('./middleware/ErrorHandlingMiddleware')
const fileUpload = require('express-fileupload')
const path = require('path')
var cron = require('node-cron');
const axios = require('axios')
const {parse} = require('node-html-parser')
const XLSX = require("xlsx")


const PORT = process.env.PORT || 5000


const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.resolve(__dirname, 'tmp')))
app.use(fileUpload({}))
app.use('/api', router)


app.use(errorHandler)

const start = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        app.listen(PORT, ()=> console.log(`Server started on a port ${PORT}`))
    } catch (e) {
        console.log(e);
    }
}

start()


cron.schedule('0 0 0 * * *', async () => {
    console.log("test");
    try {
        const workbook = XLSX.readFile("./spreadsheets/tSTORe.xlsx")
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]

        const res = await axios.get('https://tg-backend-database.herokuapp.com/api/device/')
        const devices = res.data.rows
        for(let i = 0; i < devices.length; i++) {
            try {
            const device = devices[i]
            const url = device.url

            for(let i = 2; i< workbook.Strings.length; i++) {

                const price = worksheet[`D${i}`]
                const XLSXurl = worksheet[`F${i}`]

                if (price && XLSXurl &&  XLSXurl?.v !== "-") {
                    if (url === XLSXurl.v) {

                        await axios.put(`https://tg-backend-database.herokuapp.com/api/device/url`, {
                            price: price.v,
                            url
                        })
                        console.log('sucsess', device.price + " to " + price.v);
                        break
                    } 
                }
            }

            
            } catch (error) {
                console.log(error);
            }
        }
    } catch (err) { 
        console.log(err);
    }

}); 