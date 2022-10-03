const User = require('../models/User')
const Post = require('../models/Post')

exports.login = (req, res) => {
    let userLogin = req.body
    let user = new User(userLogin)
    user.login().then((result) => {
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch((err) => {
        req.flash('errors', err)
        req.session.save(() => {
            res.redirect('/')
        })
    })
}

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/')
    })
}

exports.register = (req, res) => {
    let user =  new User(req.body)
    user.register().then((result) => {
        req.session.user = {username: user.data.username, avatar: user.avatar, _id: user.data._id}
        req.session.save(function() {
            res.redirect('/')
        })
    }).catch((regErrors) => {
        regErrors.forEach((err) => {
            req.flash('regErrors', err)
        })
        req.session.save(() => {
            res.redirect('/')
        })
    })
}

exports.mustBeLoggedIn = function(req, res, next) {
    if(req.session.user) {
        next()
    } else {
        req.flash('errors', 'You most be logged in to perform that action')
        req.session.save(function() {
            res.redirect('/')
        })
    }
}

exports.home = (req, res) => {

    if( req.session.user) {
        res.render('home-dashboard')
    } else {
        res.render('home-guest', {regErrors: req.flash('regErrors')})
    }
}

exports.ifUserExists = function(req, res, next) {
    User.findByUsername(req.params.username).then(function(userDocument) {
        req.profileUser = userDocument
        next()
    }).catch(function() {
        res.render('404')
    })
}

exports.profilePostsScreen = function(req, res) {
// Ask our post model for posts by a vertain author id
    Post.findAuthorById(req.profileUser._id).then(function(posts) {
        res.render('profile', {
            posts: posts,
            profileUsername: req.profileUser.username,
            profileAvatar: req.profileUser.avatar
        })

    }).catch(function() {
        res.render('404')
    })

}