const crypto = require('crypto')

const pick = require('@/lib/pick')
const Project = require('@/models/project')
const UserCreator = require('@/services/user_creator')

class ProjectCreator {
  constructor({ data, transaction = null }) {
    this.data = pick(data, ['name', 'time_zone'])
    this.transaction = transaction
    this.userData = pick(data.user, ['email'])
  }

  static generateSecret() {
    return crypto
      .randomBytes(48)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  createUser() {
    const creator = new UserCreator({
      data: this.userData,
      transaction: this.transaction,
    })

    return creator.create()
  }

  createWithTransaction() {
    return Project.transaction(async (transaction) => {
      this.transaction = transaction

      const create = await this.create()

      this.transaction = null

      return create
    })
  }

  async create() {
    if (!this.transaction) {
      return this.createWithTransaction()
    }

    const user = await this.createUser()

    const project = await Project.query(this.transaction)
      .insert({
        ...this.data,
        user_id: user.id,
        secret: this.constructor.generateSecret(),
      })
      .returning('*')

    project.$setRelated('user', user)

    return project
  }
}

module.exports = ProjectCreator
