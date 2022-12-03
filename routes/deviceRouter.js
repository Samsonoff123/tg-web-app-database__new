const Router = require('express')
const router = new Router()
const DeviceController = require('../controllers/deviceController')
const checkRole = require('../middleware/checkRoleMiddleware')

router.post('/', checkRole('ADMIN'), DeviceController.create)
router.get('/', DeviceController.getAll)
router.get('/type/:id', DeviceController.getAllByType)
router.get('/:id', DeviceController.getOne)
router.delete('/:id', checkRole('ADMIN'), DeviceController.remove)
router.put('/url', DeviceController.priceUpdater)

router.post('/parse', checkRole('ADMIN'), DeviceController.parse)

module.exports = router