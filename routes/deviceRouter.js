const Router = require('express')
const router = new Router()
const DeviceController = require('../controllers/deviceController')
const checkRole = require('../middleware/checkRoleMiddleware')

router.post('/', checkRole('ADMIN'), DeviceController.create)
router.get('/', DeviceController.getAll)

router.get('/type/:id/lowToHight', DeviceController.getByPriceLowToHight)
router.get('/type/:id/hightToLow', DeviceController.getByPriceHightToLow)

router.get('/type/:id', DeviceController.getAllByType)
router.get('/:id', DeviceController.getOne)
router.delete('/:id', checkRole('ADMIN'), DeviceController.remove)
router.put('/url', checkRole('ADMIN'), DeviceController.priceUpdater)

router.post('/parse', checkRole('ADMIN'), DeviceController.parse)

module.exports = router