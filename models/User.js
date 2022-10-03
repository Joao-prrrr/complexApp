const bcrypt = require('bcryptjs')
const validator = require('validator')
const usersCollection = require('../db').db().collection('users')
const md5 = require('md5')
const { type } = require('express/lib/response')

let User = function(data, getAvatar) {
    this.data = data
    this.errors = []

    if(getAvatar == undefined) {getAvatar = false}
    if(getAvatar) {this.getAvatar()}
}

User.prototype.cleanUp = function() {
    if(typeof(this.data.username) != 'string') {
        this.data.username = ''
    } else if(typeof(this.data.email) != 'string') {
        this.data.email = ''
    } else if(typeof(this.data.password) != 'string') {
        this.data.password = ''
    }

    // get rid of any bogus properties

    this.data = {
        username : this.data.username.trim().toLowerCase(),
        email : this.data.email.trim().toLowerCase(),
        password : this.data.password
    }

}

User.prototype.validate = function() {
    return new Promise(async (resolve, reject) => {
        if(this.data.username == "") {this.errors.push("Usenames can't be empty")}
    if(this.data.username != "" && !validator.isAlphanumeric(this.data.username)){this.errors.push("Usenames most only contain letters and numbers")}
    if(!validator.isEmail(this.data.email) && this.data.email != "") {this.errors.push("Email is not valid")}
    if(this.data.password == "" || this.data.password.length < 12) {this.errors.push("Passwords most be longer than 12 caracthers")}

    // Only if username and email are valids, check if they are taken
    if(!this.errors.length) {
        let usernameExists = await usersCollection.findOne({username: this.data.username})
        if(usernameExists) {this.errors.push('That username is already taken.')}

        let emailExists = await usersCollection.findOne({email: this.data.email})
        if(emailExists) {this.errors.push('That email is already taken.')}
    }
    resolve()
    })
}

User.prototype.login = function() {
    return new Promise((resolve, reject) => {
        this.cleanUp()
        //Verify if the infos of loginUser is in dataBase
        usersCollection.findOne({username: this.data.username}).then((attemptedUser) => {
            if(attemptedUser && bcrypt.compareSync(this.data.password, attemptedUser.password)) {
                this.data = attemptedUser
                this.getAvatar()
                resolve('Congrats')
            } else {
                reject('Invalid username / password')
            }
        }).catch( () => {
            reject('Error, try again later.')
        })
    })
}

User.prototype.register = function() {
    return new Promise(async (resolve, reject) => {
        this.cleanUp()
        await this.validate()
    
        if(!this.errors.length) {
            const salt = bcrypt.genSaltSync(10)
            this.data.password = bcrypt.hashSync(this.data.password, salt)
           await usersCollection.insertOne(this.data)
           this.getAvatar()
           resolve()
        }   else {
            reject(this.errors)
        }
    })
}

User.prototype.getAvatar = function() {
    this.avatar = `https://gravatar.com/avatar/${md5(this.data.email)}?s=128`

}

User.findByUsername = function(username) {
    return new Promise(function(resolve, reject) {
        if(typeof(username) != "string") {
            reject()
            return
        }

        usersCollection.findOne({username: username}).then(function(userDoc) {
            if(userDoc) {
                userDoc = new User(userDoc, true)
                userDoc = {
                    _id: userDoc.data._id,
                    username: userDoc.data.username,
                    avatar: userDoc.avatar
                }
                resolve(userDoc)
            } else {
                reject()
            }
        }).catch(function() {
            reject()
        })

    }) 
}

module.exports = User