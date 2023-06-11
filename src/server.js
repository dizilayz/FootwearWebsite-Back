import express from "express";
import bodyParser from "body-parser";
import { MongoClient, ServerApiVersion } from "mongodb";
import path from 'path';
import history from "connect-history-api-fallback";

const app = express();
app.use(bodyParser.json());
app.use('/images', express.static(path.join(__dirname, '../assets')));

app.use(express.static(path.resolve(__dirname, '../src/dist'), { maxAge: '1y', etag: false }));
app.use(history());



const uri = "mongodb+srv://footwear-backend:qwerty123@cluster0.suoeh94.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (err) {
        console.log(err);
    }
}
run();

app.get('/api/products', async (req, res) => {
    try {
        const db = client.db('test');
        const products = await db.collection('products').find().toArray();
        res.status(200).json(products);
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
})


app.get('/api/users/:userId/cart', async (req, res) => {
    try {
        const { userId } = req.params
        const db = client.db('test');
        const user = await db.collection('users').findOne({ id: userId });
        if (!user) return res.status(404).json('Could not find the user');
        const products = await db.collection('products').find({}).toArray();
        const cartItemsIds = user.cartItems;
        const cartItems = cartItemsIds.map(id =>
            products.find(product => product.id === id));
        res.status(200).json(cartItems);
    } catch(err)  {
        console.log(err);
        res.status(500).send('Internal server error');
    }
})


app.get('/api/products/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const db = client.db('test');
        const product = await db.collection('products').findOne({ id: productId });
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).json('Could not find the product');
        }
    } catch(err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
})



app.post('/api/users/:userId/cart', async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId } = req.body;
        const db = client.db('test');
        await db.collection('users').updateOne({ id: userId }, {
            $addToSet: { cartItems: productId },
        });
        const user = await db.collection('users').findOne({ id: userId });
        const products = await db.collection('products').find({}).toArray();
        const cartItemIds = user.cartItems;
        const cartItems = cartItemIds.map(id =>
            products.find(product => product.id === id));
        res.status(200).json(cartItems);
    } catch(err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
})

app.delete('/api/users/:userId/cart/:productId', async (req, res) => {
    try {
        const { userId, productId } = req.params;
        const db = client.db('test');
        await db.collection('users').updateOne({ id: userId }, {
            $pull: { cartItems: productId },
        });
        const user = await db.collection('users').findOne({ id: userId });
        const products = await db.collection('products').find({}).toArray();
        const cartItemsIds = user.cartItems;
        const cartItems = cartItemsIds.map(id =>
            products.find(product => product.id === id)
        );
        res.status(200).json(cartItems);
    } catch(err) {
        console.log(err);
        res.status(500).send('Internal server error');
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../src/dist/index.html'))
});


app.listen(1000, () => {
    console.log('server is listenin on port 1000')
});

process.on('SIGINT', () => {
    client.close().then(() => {
        console.log('MongoDB connection is closed.');
        process.exit(0);
    }).catch((err) => {
        console.log(err);
        process.exit(1);
    });
});