const { network, ethers } = require("hardhat")
const { developmentChains, networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const fs = require("fs")

module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    let ethUsdPriceFeedAddress

    if (developmentChains.includes(network.name)) {
        const EthUsdAggregator = await ethers.getContract("MockV3Aggregator")
        ethUsdPriceFeedAddress = EthUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("--------------------------------")
    const lowSvg = await fs.readFileSync("./images/dynamicNFT/frown.svg", {
        encoding: "utf8",
    })
    const highSvg = await fs.readFileSync("./images/dynamicNFT/happy.svg", {
        encoding: "utf8",
    })
    args = [ethUsdPriceFeedAddress, lowSvg, highSvg]
    const DynamicSvgNft = await deploy("DynamicSvgNft", {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    })
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        log("Verifying...")
        await verify(DynamicSvgNft.address, args)
    }
    log("--------------------------------")
}

module.exports.tags = ["all", "dynamic", "svg", "main"]
