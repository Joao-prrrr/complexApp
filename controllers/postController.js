const { redirect } = require('express/lib/response')
const Post = require('../models/Post')

exports.viewCreateScreen = function(req, res){
    res.render('create-post')
}

exports.create = function(req, res) {
    let post = new Post(req.body, req.session.user._id)
    post.create().then(function() {
        res.redirect(`/post/${post.data._id}`)
    }).catch(function(errors) {
        res.send(errors)
    })
}

exports.viewSingle = async function(req, res) {
    // let post = Post.findSingleById(req.params.id).then(function() {
    //     res.render('single-post-screen', {post: post})
    // }).catch(function() {
    //     res.send('404')
    // })


    try {
        let post = await Post.findSingleById(req.params.id, req.visitorId)
        res.render('single-post-screen', {post: post})
    }
    catch {
        res.render('404')
    }
}

exports.viewEditScreen = async function(req, res) {
    try {
        let post = await Post.findSingleById(req.params.id)
        if(post.authorId == req.visitorId) {
            res.render('edit-post', {post: post})
        }   else {
            req.flash('errors', 'You do not have permission to perform this action')
            req.session.save(() => res.redirect('/'))
        }
    } catch {
        res.render('404')
    }
}

exports.edit = function(req, res) {
    let post = new Post(req.body, req.visitorId, req.params.id)
    post.update().then(function(status) {
        //the post was successfully updated in the datebase
        // or user did have permission, but there were validation errors
        if(status = "success") {
            //post was updated in db
            req.flash('success', 'Post successfully updated.')
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        } else {
            post.errors.forEach(function(error) {
                req.flash('errors', error)
            })
            req.session.save(function() {
                res.redirect(`/post/${req.params.id}/edit`)
            })
        }
    }).catch(() => {
        // a post with requested id doesnt exixt
        // or if the current visitor is not the owner of the requested post
        req.flash('errors', 'You do not have permission to perform that action.')
        req.session.save(function() {
            res.redirect('/')
        })
    })
}