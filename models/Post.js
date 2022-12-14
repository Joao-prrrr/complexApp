const postsCollection = require('../db').db().collection('posts')
const ObjectID = require('mongodb').ObjectId
const { post } = require('../router')
const User = require('./User')

let Post = function(data, userId, requestedPostId) {
    this.data = data
    this.errors = []
    this.userId = ObjectID(userId)
    this.requestedPostId = requestedPostId
}

Post.prototype.cleanUp = function() {
    // Make sure that posts are strings
    if(typeof(this.data.title) != "string") {this.data.title = ""}
    if(typeof(this.data.body) != "string") {this.data.body = ""}

    this.data = {
        title: this.data.title.trim(),
        body: this.data.body.trim(),
        createdDate: new Date(),
        author: this.userId
    }
}

Post.prototype.validate = function() {
    if(this.data.title == "") {this.errors.push('You must provide a title.')}
    if(this.data.body == "") {this.errors.push('You must provide a post content.')}
}


Post.prototype.create = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        this.validate()

        if(!this.errors.length) {
            //Save this data in database
            postsCollection.insertOne(this.data).then(() => {
                //Async function. Will finish insertOne() before starting resolve()
                resolve()
            }).catch(() => {
                this.errors.push('Please try again later.')
                reject(this.errors)
            })
        }   else {
            reject(this.errors)
        }
    })
}

Post.reusablePostQuery =  function(uniqueOperations, visitorId) {
    return new Promise(async function(resolve, reject) {
        
        let aggOperations = uniqueOperations.concat([
            {$lookup: {from: "users", localField: "author", foreignField: "_id", as: "authorDocument"}},
            {$project: {
                title: 1,
                body: 1,
                createdDate: 1,
                authorId: "$author",
                author: {$arrayElemAt: ["$authorDocument", 0]}
            }}
        ])

        let posts = await postsCollection.aggregate(aggOperations).toArray()

        // Clean up  author object
        posts = posts.map(function(post) {
            post.isVisitorOwner = post.authorId.equals(visitorId)

            post.author = {
                username: post.author.username,
                avatar: new User(post.author, true).avatar
            }
            return post
        })
        resolve(posts)
    })
}

Post.findSingleById =  function(id, visitorId) {
    return new Promise(async function(resolve, reject) {
        if(typeof(id) != "string" || !ObjectID.isValid(id)) {
            reject()
            return
        }

Post.prototype.update = function() {
    return new Promise(async (resolve, reject) => {
        try {
            let post = await Post.findSingleById(this.requestedPostId, this.userId)
            if (post.isVisitorOwner) {
                let status = await this.actuallyUpdate()
                resolve(status)
            } else {
                reject()
            }
        } catch {
            reject()
        }
    })
}

Post.prototype.actuallyUpdate = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        this.validate()
        if(!this.errors.length) {
            await postsCollection.findOneAndUpdate({_id:new ObjectID(this.requestedPostId)}, {$set: {title: this.data.title, body: this.data.body}})
            resolve('success')
        } else {
            resolve('failure')

        }
    })
}

        let posts = await Post.reusablePostQuery([
            {$match: {_id:new ObjectID(id)}}
        ], visitorId)

        if(posts.length) {
            console.log(posts[0])
            resolve(posts[0])
        } else {
            reject()
        }
    })
}

Post.findAuthorById = function(authorId) {
    return Post.reusablePostQuery([
        {$match: {author: authorId  }},
        {$sort: {createdDate: -1}}
    ])
}
module.exports = Post