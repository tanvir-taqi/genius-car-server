const express = require('express')
const cors = require('cors')
const port = process.env.PORT || 5000
const app = express()
const jwt = require('jsonwebtoken')

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()


app.use(cors())
app.use(express.json())




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.n9wsaaw.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


const verifyJWT = (req,res,next) =>{
    const authHeader = req.headers.authorization
    if(!authHeader){
       return res.status(401).send({message:"unothorized user"})
    }
    const token = authHeader.split(' ')[1]
    jwt.verify(token,process.env.ACCESS_TOKEN_SECRET , (err,decoded)=>{
        if(err){
          return  res.status(401).send({message:"unothorized user"})
        }
        req.decoded = decoded
        next()
    })
}

const run = async ()=>{
    try{
            const serviceCollection = client.db('geniuscar').collection('services')
            const orderCollection = client.db('geniuscar').collection('orders')

            app.get('/services', async(req,res)=>{
                const cursor = serviceCollection.find({});
                const services = await cursor.toArray()
                res.send(services)
            })


            app.post('/jwt',(req,res)=>{
                const user = req.body
                const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET ,  { expiresIn: '10y' })
                console.log(user);
                res.send({token})

            })



            app.get('/services/:id', async (req,res)=>{
                const id = req.params.id 
                const query = {_id : ObjectId(id)}
                const service = await serviceCollection.findOne(query);
                res.send(service)
            })


            app.get('/orders', verifyJWT , async(req,res)=>{
                const decoded = req.decoded
                console.log(decoded);

                if(decoded.email !== req.query.email){
                    return  res.status(403).send({message:"unothorized user"})
                }
              
                let query = {}
                if(req.query.email){
                    query = {email: req.query.email}
                }
                const cursor = orderCollection.find(query)
                const orders = await cursor.toArray()
                res.send(orders)
            })



            app.post('/orders',async (req,res)=>{
                const order = req.body
                const result = await orderCollection.insertOne(order)
                res.send(result)
              })


            app.patch('/orders/:id', verifyJWT, async (req,res)=>{
                const id = req.params.id
                const query = {_id : ObjectId(id)}
                const status = req.body.status 
                const updatedDoc ={
                    $set:{
                        status:status
                    }

                }
                const result = await orderCollection.updateOne(query,updatedDoc)
                res.send(result)

            })
            app.delete('/orders/:id', verifyJWT, async (req,res)=>{
                const id = req.params.id 
                const query = {_id : ObjectId(id)}
                const result = await orderCollection.deleteOne(query)
                res.send(result)

            })
    }
    finally{

    }
}
run().catch(err => console.log(err))

app.get('/',(req,res)=>{
    res.send("genius car server is running");
})

app.listen(port,()=>{
    console.log("server runnning");
})