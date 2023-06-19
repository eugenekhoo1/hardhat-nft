const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("RandomNFT Unit Tests", function () {
          let randomNft, deployer, vrfCoordinatorV2Mock

          beforeEach(async function () {
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              await deployments.fixture(["mocks", "randomnft"])
              randomNft = await ethers.getContract("RandomIpfsNFT", deployer)
              vrfCoordinatorV2Mock = await ethers.getContract(
                  "VRFCoordinatorV2Mock"
              )
          })

          describe("constructor", function () {
              it("initializes RandomNft correctly", async function () {
                  const firstTokenUri = await randomNft.getTokenUris(0) // returns ipfs hash
                  const tokenCounter = await randomNft.getTokenCounter()
                  assert(firstTokenUri.toString().includes("ipfs://"))
                  assert.equal(tokenCounter.toString(), "0")
              })
          })

          describe("requestNft", function () {
              it("revert if no eth value input", async function () {
                  await expect(randomNft.requestNft()).to.be.revertedWith(
                      "RandomIpfsNFT__InsufficientEth"
                  )
              })

              it("revert if insufficient eth", async function () {
                  // mintFee = 0.01 ETH
                  await expect(
                      randomNft.requestNft({
                          value: ethers.utils.parseEther("0.001"),
                      })
                  ).to.be.revertedWith("RandomIpfsNFT__InsufficientEth")
              })

              it("emits NftRequested event if mintFee paid", async function () {
                  const mintFee = await randomNft.getMintFee()
                  await expect(
                      randomNft.requestNft({ value: mintFee })
                  ).to.emit(randomNft, "NftRequested")
              })
          })

          describe("fulfillRandomWords", function () {
              it("mints nft after random number is returned", async function () {
                  await new Promise(async (resolve, reject) => {
                      randomNft.once("NftMinted", async function () {
                          console.log("Event emitted!")
                          // check stuff
                          try {
                              const firstTokenUri =
                                  await randomNft.getTokenUris(0) // returns ipfs hash
                              const tokenCounter =
                                  await randomNft.getTokenCounter()
                              assert(
                                  firstTokenUri.toString().includes("ipfs://")
                              )
                              assert.equal(tokenCounter.toString(), "1")
                              resolve()
                          } catch (e) {
                              console.log(e)
                              reject(e)
                          }
                      })
                      try {
                          const mintFee = await randomNft.getMintFee()
                          const tx = await randomNft.requestNft({
                              value: mintFee,
                          })
                          const txReceipt = await tx.wait(1)
                          await vrfCoordinatorV2Mock.fulfillRandomWords(
                              txReceipt.events[1].args.requesId,
                              randomNft.address
                          )
                      } catch (e) {
                          console.log(e)
                          reject(e)
                      }
                  })
              })
          })

          describe("getBreedFromModdedRng", function () {
              it("get pug (0) if number is 0-9", async function () {
                  const dog = await randomNft.getBreedFromModdedRng(5)
                  assert.equal(dog.toString(), "0")
              })

              it("get shiba-inu (1) if number is 10-29", async function () {
                  const dog = await randomNft.getBreedFromModdedRng(13)
                  assert.equal(dog.toString(), "1")
              })

              it("get st-bernard (2) if number is 30-99", async function () {
                  const dog = await randomNft.getBreedFromModdedRng(55)
                  assert.equal(dog.toString(), "2")
              })

              it("revert if number out of range", async function () {
                  await expect(
                      randomNft.getBreedFromModdedRng(102)
                  ).to.be.revertedWith("RandomIpfsNFT__RangeOutOfBounds")
              })
          })
      })
