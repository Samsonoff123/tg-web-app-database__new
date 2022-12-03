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

        const res = await axios.get('https://tg-web-app-database-new-z3e1-9tty5xsk0-samsonoff123.vercel.app/api/device/')
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

                        await axios.put(`https://tg-web-app-database-new-z3e1-9tty5xsk0-samsonoff123.vercel.app/api/device/url`, {
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



const TelegramBot = require('node-telegram-bot-api');

const tgStart = () => {

    const token = process.env.NODE_TG_TOKEN
    const webAppUrl = process.env.NODE_TG_URL
    const adminName = process.env.NODE_TG_ADMIN
    const adminChatId = process.env.NODE_TG_ADMIN_CHAT
    
     
    const bot = new TelegramBot(token, {polling: true});
    
    bot.on('message', async(msg) => { 
      const chatId = msg.chat.id;
      const text = msg.text;
      const button = 'Магазин'
      const admin = 'admin' 
    
    
      if(text === '/start') {
        await bot.sendMessage(chatId, 'Добро пожаловать, ' + msg.chat.first_name + ' ' + msg.chat.last_name + '.\n' + 'Нажмите на кнопку "' + button + '" что-бы продолжить', {
            reply_markup: {
              resize_keyboard: true,
                keyboard: [
                    [{text: button, web_app: {url: webAppUrl + '/1'}}]   
                ]
            }
        })
      }
    
    
      if(msg.chat.username === adminName && text === '/admin') {
        await bot.sendMessage(chatId, 'Добро пожаловать, ' + msg.chat.first_name + ' ' + msg.chat.last_name + '.\n' + 'Нажмите на кнопку "' + admin + '" что-бы переидти на админку', {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [
                  [{text: admin, web_app: {url: webAppUrl + '/login'}}]
              ]
          }
        })
      }
    
      // if(msg?.web_app_data?.data) {
      //   try {
      //     const data = JSON.parse(msg?.web_app_data?.data)
      //     await bot.sendMessage(chatId, 'Ваша страна: ' + data?.country)
      //     await bot.sendMessage(chatId, 'Ваша улица: ' + data?.street)
      //   } catch (e) {
      //     console.log(e);
      //   }
      // }
      if(msg?.web_app_data?.data) {  
        try {
          const data = JSON.parse(msg?.web_app_data?.data)
          await bot.sendMessage(adminChatId, `ФИО: ${msg.chat.first_name} "${msg.chat.username}" ${msg.chat.last_name} \n Наименование: ${data?.name}; \n Цена: ${data?.price}; \n Память: ${data?.memory}; \n Способ оплаты и доставки: ${data?.delivery} \n`)
        } catch (e) {
          console.log(e);
        }
      }
    });
}

tgStart()

