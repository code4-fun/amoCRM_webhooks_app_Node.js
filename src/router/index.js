import {Router} from 'express'
import AppController from '../controller/AppController.js'
import bodyParser from 'body-parser'

const router = Router()
const urlencodedParser = bodyParser.urlencoded({ extended: true })

router.post('/process_webhooks', urlencodedParser, AppController.processWebhooks)

export default router
