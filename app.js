const express = require('express');
const bodyParser = require('body-parser');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs')

const Event = require('./model/event');
const User = require('./model/user');

const app = express();

app.use(bodyParser.json());

app.use('/graphql',
    graphqlHTTP({
        schema: buildSchema(`
            type Event {
                _id: ID!
                title: String!
                description: String!
                price: Float!
                date: String!
            }

            type User {
                _id: ID!
                email: String!
                password: String
            }

            input EventInput {
                title: String!
                description: String!
                price: Float!
                date: String
            }

            input UserInput {
                email: String!
                password: String!
            }

            type RootQuery {
                events: [Event!]!
                users: [User!]!
            }

            type RootMutation {
                createEvent(eventInput: EventInput): Event
                createUser(userInput: UserInput): User
            }

            schema {
                query: RootQuery
                mutation: RootMutation
            }
        `),
        rootValue: {
            events : async () => {
                return await Event.find();
            },
            createEvent : async (args) => {
                const event = {
                    title: args.eventInput.title,
                    description: args.eventInput.description,
                    price: +args.eventInput.price,
                    date: new Date(),
                    creator: "5f1efde622554199505f9198"
                };
                
                const createdEvent = await Event.create(event);

                const user = await User.findById('5f1efde622554199505f9198');
                console.log(user);
                
                if(!user) {
                    throw Error("User not found")
                }
                console.log(event);
                
                user.createdEvents.push(createdEvent); 
                console.log(user);
                
                await user.save();

                return createdEvent
            },
            createUser: async args => {
                const currentUser = await User.findOne({email: args.userInput.email})
                if(currentUser) {
                    throw Error("User is already exists")
                }
                const hashedPassword = await bcrypt.hash(args.userInput.password, 12);
                const user = {
                    email: args.userInput.email,
                    password: hashedPassword
                };

                const createdUser = await User.create(user);

                return { ...createdUser._doc, password:null };
            }
        },
        graphiql:true
    }
))

mongoose.connect(`mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.xbezd.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
})
.then(() => {
    app.listen(3000);
    console.log('Connected');
})
.catch(err => {
    console.log(err);
    
});