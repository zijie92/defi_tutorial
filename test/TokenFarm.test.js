const { assert } = require('chai')
const DaiToken = artifacts.require('DaiToken')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

function tokens(n){
    return web3.utils.toWei(n, 'ether')
}

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm

    before(async () =>{
        //load contracts
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(dappToken.address, daiToken.address)

        // transfer all DAPP tokens to tokenfarm
        await dappToken.transfer(tokenFarm.address, tokens('1000000'))

        //send tokens to invester
        await daiToken.transfer(investor, tokens('100'),{from: owner})

    })

    describe('Mock Dai Deployment', async () => {
        it('has a name', async() =>{
            const token_name = await daiToken.name()
            assert.equal(token_name, 'Mock DAI Token')
        })
    })


    describe('Dapp Token Deployment', async () => {
        it('has a name', async() =>{
            const token_name = await dappToken.name()
            assert.equal(token_name, 'DApp Token')
        })
    })

    describe('Token Farm Deployment', async () => {
        it('has a name', async() =>{
            const token_name = await tokenFarm.name()
            assert.equal(token_name, 'Dapp Token Farm')
        })

        it('contract has tokens', async() => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    })

    describe('Farming Tokens', async() => {

        it('rewards investors for staking mDai Tokens', async() =>{
            let result 
            //check investor balance before staking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'Invest mock DAI wallet should be correct before staking')
            
            //Stake Mock Dai
            await daiToken.approve(tokenFarm.address, tokens('100'), {from: investor})
            
            await tokenFarm.stakeTokens(tokens('100'), {from: investor})
            
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'Invester mock DAI wallet correct after staking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'TokenFarm DAI balance correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking status is correct')

            await tokenFarm.issueTokens({from: owner})
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor gets back same amount of Dapp tokens')

            await tokenFarm.issueTokens({from:investor}).should.be.rejected

            // check unstaking
            await tokenFarm.unstakeTokens({from:investor})

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor mock dai wallet correct after unstaking')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'Token farm dai balance correct after unstaking')
        })
    })
    
})