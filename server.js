import express from "express"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import cors from "cors"
import { MongoClient } from "mongodb"
import * as dotenv from "dotenv"
dotenv.config()
const app = express()

let stupid_students_collection;


 async function DBConnection(){
const connection_db = async ()=>{
    let connection =  new MongoClient(process.env.DB_URI)
    let con = await connection.connect()
    if(con.db)
    if(! con.db("nodejs").collection("stupid_students"))
   await con.db("nodejs").createCollection("stupid_students");
   else{
   let list_of_collection =  await con.db("nodejs").listCollections().toArray();
   console.log("\n", MAGENTA_COLOR_CODE, "database is connected \n");
   console.log("\n", CYAN_COLOR_CODE, "list_of_collection\n ")
  
   list_of_collection.forEach((e,index)=>console.log(index+1, ").",YELLOW_COLOR_CODE, e.name))
   }
   stupid_students_collection =   con.db("nodejs").collection("stupid_students");
}
 await connection_db()
}




 function TokenGen(email) {
    const token =  jwt.sign({"email" : email}, "123456789", {algorithm : "HS256"})
    if(token)
    return token
    return "token not generated"
}




function Routes(){
    const routes = express.Router()


    routes.post('/login', async function (req, res) {
      console.log(req.body)
        try {
          const user = await stupid_students_collection.findOne({ email: req.body.email });
          console.log("user", user);
          if(user == null)
      return res.send(false)
          if (user) {
            const isUserPasswordMatch = await bcrypt.compare(req.body.password, user.password);
            if (isUserPasswordMatch) {
              const token = TokenGen(req.body.email);
              console.log(token, typeof (token));
              if (typeof token === 'string') {
                return res.json({ token: token, email: req.body.email });
              }
              return res.status(500).send("Something went wrong");
            }
          }
          
          return res.status(401).send("User does not exist or password is incorrect");
        } catch (error) {
          console.error("Error occurred:", error);
          return res.status(500).send("An error occurred while processing the request.");
        }
      });

    routes.post('/signup', async function(req, res){
       
        const doclen = await stupid_students_collection.find().count()
        const find_Exist_user = await stupid_students_collection.find({email: req.body.email}).toArray();
       
        if(find_Exist_user[0] && find_Exist_user[0].email){
            // console.log("existing", find_Exist_user)
        return res.send("user email already exists")
        }
        const stupid_salt = await bcrypt.genSalt(10)
        const important_hash = await bcrypt.hash(req.body.password,stupid_salt)
        req.body["password"] = important_hash
        await stupid_students_collection.insertOne({...req.body})
        if(await stupid_students_collection.find().count() > doclen) {
            let token = TokenGen(req.body.email)
        return res.send(token)
        }
            return res.send("something went wrong")
    })

    routes.post("/user", async (req, res) => {
        console.log("req.body", req.body);
      
        try {
          const findExistUser = await stupid_students_collection.find({ email: req.body.PrevEmail }).toArray();
          
          if (findExistUser[0] && findExistUser[0].email) {
            await stupid_students_collection.updateOne(
              { email: req.body.PrevEmail },
              { $set: { email: req.body.Newemail } }
            );
            
            const updatedUser = await stupid_students_collection.find({ email: req.body.Newemail }).toArray();
            return res.send(updatedUser[0].email);
          }
        } catch (error) {
          console.error("Error occurred:", error);
          return res.status(500).send("An error occurred while processing the request.");
        }
      
        return res.send("");
      });
      
        
routes.post("/delete", async(req, res) => {
    try {
        const emailToDelete = req.body.email;
        const deletedUser = await stupid_students_collection.findOneAndDelete({ email: emailToDelete });
    
        if (deletedUser.value && deletedUser.value.email) {
          return res.send(`User with email ${deletedUser.value.email} has been deleted.`);
        } else {
          return res.status(404).send(`User with email ${emailToDelete} not found.`);
        }
      } catch (error) {
        console.error("Error occurred:", error);
        return res.status(500).send("An error occurred while processing the request.");
      }
})
    return routes
}




app.use(cors({origin: "*"}))
app.use(express.json())
app.use(Routes())

const RED_COLOR_CODE = '\x1b[31m';
const RESET_COLOR_CODE = '\x1b[0m';
const GREEN_COLOR_CODE = '\x1b[32m';
const YELLOW_COLOR_CODE = '\x1b[33m';
const BLUE_COLOR_CODE = '\x1b[34m';
const MAGENTA_COLOR_CODE = '\x1b[35m';
const CYAN_COLOR_CODE = '\x1b[36m';

async function StartEngine(){
    await DBConnection()
    app.listen(8080, ()=>console.log(`\n ${RED_COLOR_CODE}server is running on port 8080${RESET_COLOR_CODE} \n`))
    // const docs = await stupid_students_collection.find().toArray()
    // console.log(docs)
}
StartEngine()