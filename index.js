import express from 'express'
import router from './src/router/index.js'
import 'dotenv/config'

const PORT = process.env.PORT || 8002

const app = express()
app.use(express.json())
app.use('/api', router)

const startApp = async () => {
  try{
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`))
  } catch(e){
    console.log(e)
  }
}

startApp()
