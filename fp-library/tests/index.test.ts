let socket = require('../index')
let sinon = require('sinon')

import { expect } from 'chai'

describe('Index file', () => {

    it('Should be function', () => {
        expect(socket).to.be.a('function');
    })

    it('Should return a function and should print to console error', () => {
        let spy = sinon.spy(console, 'log')
        let result = socket()
        expect(socket).to.be.a('function')
        expect(spy.calledWith('\u001b[31mError: No worker was provided\u001b[0m')).to.be.eq(true)
        spy.restore()
    })

})