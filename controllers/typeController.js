const {Type} = require('../models/models')
const ApiError = require('../error/ApiError')

class TypeController {
    async create(req, res) {
        const {name} = req.body
        const type = await Type.create({name})
        return res.json(type)
    }

    async getAll(req, res) {
        const types = await Type.findAll()
        return res.json(types)
    }

    async remove(req, res) {
        try {
            const {name} = req.body
    
            await Type.destroy({
                where: {name: name},
            })

            const types = await Type.findAll()

            return res.json(types)
    
        } catch (err) {
            console.log(err);
            res.status(500).json({
                message: 'Не удалось получить тип'
            })
        }
    }
}

module.exports = new TypeController()