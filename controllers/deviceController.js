const uuid = require('uuid')
const path = require('path')
const { Device, DeviceInfo } = require('../models/models')
const ApiError = require('../error/ApiError')
const axios = require('axios')
const {parse} = require('node-html-parser')
const  { Op, Sequelize } = require("sequelize");

class DeviceController {
    async create(req, res, next) {
        console.log(req.body.variations);
        try {
            let {name, price, tag, brandId, typeId, img, html, variations, sliderImg, url} = req.body  
 
            const device = await Device.create({ name, price, tag, brandId, typeId, img, html, variations, sliderImg, url })
            
            // if (info) {
            //     info = JSON.parse(info) 
            //     info.forEach(i => 
            //         DeviceInfo.create({
            //             title: i.title, 
            //             description: i.description, 
            //             deviceId: device.id
            //         })
            //     )
            // }  
     
            return res.json(device)
        } catch (e) {
            next(ApiError.badRequest(e))
        }   
    }  
  
    async getAll(req, res) {
        let {brandId, typeId, limit, page } = req.query
        page = page || 1
        limit = limit || 100
        let offset = page * limit - limit
        let devices
        if(!brandId && !typeId) {
            devices = await Device.findAndCountAll({limit, offset, attributes: {exclude: ['html', 'variations', 'sliderImg']},})
        }
        if (brandId && !typeId) {
            devices = await Device.findAndCountAll( {where:{brandId}, attributes: {exclude: ['html', 'variations', 'sliderImg']},})
        }
        if (!brandId && typeId) {
            devices = await Device.findAndCountAll({where:{typeId}, limit, offset, attributes: {exclude: ['html', 'variations', 'sliderImg']},})
        }
        if (brandId && typeId) {
            devices = await Device.findAndCountAll( {where:{typeId, brandId}, limit, offset, attributes: {exclude: ['html', 'variations', 'sliderImg']},})
        }
        return res.json(devices)
    }

    async getAllByType(req, res) { 
        let {limit, page } = req.query
        let { id } = req.params
        page = page || 1
        limit = limit || 10
        let offset = page * limit - limit
        const devices = await Device.findAndCountAll({  
            where: {
              typeId: id  
            }, 
            limit, offset,
            attributes: {
                exclude: ['html', 'variations', 'sliderImg']
            }, 
        })


        return res.json(devices)
    }

    async getOne(req, res) {
        const {id} = req.params
        const device = await Device.findOne(
            {
                where: {id},
                include: [{model: DeviceInfo, as: 'info'}]
            }
        )

        const similarDevices = await Device.findAll(
            {
                where: {
                    tag: {
                        [Op.match]: Sequelize.fn('to_tsquery', device.tag.replaceAll(' ', ' & '))
                    }
                },
                attributes: {exclude: ['html', 'variations', 'sliderImg']}
            }
        )

        const typeDevices = await Device.findAll(
            {
               where: {
                typeId: device.typeId
               },
               attributes: {exclude: ['html', 'variations', 'sliderImg']}
            }
        )
        return res.json({device, typeDevices, similarDevices})
    }

    async remove (req, res) {
        try {
            console.log(req.params.id);
            const postId = req.params.id
    
            await Device.destroy({
                where: {id: postId},
            })

            const devices = await Device.findAll()
            
            return res.json(devices)
    
        } catch (err) {
            console.log(err);
            res.status(500).json({
                message: 'Не удалось получить девайс'
            })
        }
    }

    async parse(req, res, next) {
        try {
            let { links } = req.body 
            const colorArray = []

            for(let i = 0; i < links.length; i++) {
                let link = links[i]
                const html = await axios.get(link)

                const root = parse(html.data)

                const name = root.querySelector('.site-content-inner h1').innerText
                const price = +root.querySelector('.price-current strong').innerText
                const tag = root.querySelectorAll('.site-path a')[2].innerText || "undefined"
                const brandId = 1
                const typeId = 2
                const img = 'https://sotohit.ru/' + root.querySelector('.product-item-main-pics img').rawAttrs.split(' ')[0].split('"')[1]
                const head = []
                const body = []
                root.querySelectorAll('.shop2-product-tabs a').forEach(e => {head.push(e.innerText)})
                root.querySelectorAll('.shop2-product-desc .desc-area').forEach(e => {body.push(e.innerHTML)})
                const htmlParse = {
                    "head": head,
                    "body": body,
                }
                const variations = { 
                    "Manufacturer": root.querySelectorAll('.product-item-options.reset-table td')[0].innerText,
                    "color": colorArray, 
                    "memory": root.querySelectorAll('.product-item-options.reset-table td')[3].innerText,
                    "sim": root.querySelectorAll('.product-item-options.reset-table td')[4].innerText,
                    "set": root.querySelectorAll('.product-item-options.reset-table td')[5].innerText,
                }
                const url = link
    
                const sliderImg = []
                root.querySelectorAll('.product-item-main-pics img').forEach(img => { 
                    sliderImg.push('https://sotohit.ru/' + img.rawAttrs.split(' ')[0].split('"')[1]) 
                })
                console.log(i);

                await Device.create({name, price, tag, brandId, typeId, img, html: htmlParse, variations, sliderImg, url});
            }

            return res.json("sucsess")

            // const device = await Device.create({ name, price, brandId, typeId, img, html, variations, sliderImg })
            
        } catch (e) {
            return res.json({error: e})
            next(ApiError.badRequest(e))
        }
    }

    async priceUpdater(req, res, next) {
        try {
            
            const id = req.params.id
            const {price, url} = req.body

            console.log(url);
            await Device.update(
                { 
                    price,
                 },
                { where: { url } }
            )
    
            return res.json({"sucsess" : true})
        } catch (e) {
            next(ApiError.badRequest(e))
        }
    }
}

module.exports = new DeviceController()