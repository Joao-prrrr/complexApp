const MongoStore = require('connect-mongo')
const session = require('express-session')
const express = require('express')
const flash = require('connect-flash')
const app = express()

const sessionOption = session({
    secret: 'JavaScript is cool',
    store: MongoStore.create({client: require('./db')}),
    resave: false,
    saveUninitialized: false,
    // 1000*60*60*24 == days
    cookie: { maxAge: 1000*60*60*24, httpOnly: true}
})

app.use(sessionOption)
app.use(flash())


app.use(express.urlencoded({extended:false}))
app.use(express.json())


app.use(express.static('public'))
app.set('views', 'views')
app.set('view engine', 'ejs')

app.use(function(req, res , next) {
    //make all error and succes flash messages available
    res.locals.errors = req.flash('errors')
    res.locals.success = req.flash('success')
    // make current user id avilable on the req object
    if (req.session.user) {req.visitorId = req.session.user._id} else {req.visitorId = 0}
    // make user sassion data available from within view templates
    res.locals.user = req.session.user
    next()

})

const router = require('./router')
app.use('/', router)

module.exports = app