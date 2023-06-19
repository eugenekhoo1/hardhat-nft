const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deployer } = await getNamedAccounts()

    const basicNft = await ethers.getContract("BasicNFT", deployer)
    const basicMintTx = await basicNft.mintNft()
    await basicMintTx.wait(1)
    console.log(
        `Basic NFT index 0 has tokenURI: ${await basicNft.tokenURI(0)} `
    )

    const randomNft = await ethers.getContract("RandomIpfsNFT", deployer)

    await new Promise(async (resolve, reject) => {
        setTimeout(resolve, 300000)
        randomNft.once("NftMinted", async function () {
            resolve()
        })
        const randomMintTx = await randomNft.requestNft({
            value: await randomNft.getMintFee(),
        })
        const randomMintTxReceipt = await randomMintTx.wait(1)
        if (developmentChains.includes(network.name)) {
            const requestId = randomMintTxReceipt.events[1].args.requesId
            const vrfCoordinatorV2Mock = await ethers.getContract(
                "VRFCoordinatorV2Mock",
                deployer
            )
            await vrfCoordinatorV2Mock.fulfillRandomWords(
                requestId,
                randomNft.address
            )
        }
    })
    console.log(
        `Random IPFS NFT index 0 tokenURI: ${await randomNft.getTokenUris(0)}`
    )

    const highValue = ethers.utils.parseEther("1000")
    const dyanmicSvgNft = await ethers.getContract("DynamicSvgNft", deployer)
    const DynamicSvgNftMinTx = await dyanmicSvgNft.mintNft(highValue.toString())
    await DynamicSvgNftMinTx.wait(1)
    console.log(
        `Dynamic SVG NFT index 0 tokenURI: ${await dyanmicSvgNft.tokenURI(0)}`
    )
}

module.exports.tags = ["all", "mint"]
