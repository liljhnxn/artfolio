import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { Artfolio } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("Artfolio Smart Contract", function () {
  let artfolio: Artfolio;
  let owner: HardhatEthersSigner;
  let artist1: HardhatEthersSigner;
  let artist2: HardhatEthersSigner;
  let fan1: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, artist1, artist2, fan1] = await ethers.getSigners();
    const ArtfolioFactory = await ethers.getContractFactory("Artfolio");
    artfolio = (await ArtfolioFactory.deploy()) as Artfolio;
    await artfolio.waitForDeployment();
  });

  describe("Initial State", function () {
    it("should initialize with zero active artworks and zero total likes", async function () {
      expect(await artfolio.totalActiveArtworks()).to.equal(0);
      expect(await artfolio.totalPlatformLikes()).to.equal(0);
      const allArts = await artfolio.getAllArtworks();
      expect(allArts.length).to.equal(0);
    });
  });

  describe("Publishing Artwork", function () {
    it("should allow an artist to publish artwork and emit ArtworkPublished event", async function () {
      const title = "Neon Odyssey";
      const description = "A cyberpunk journey into neon horizons.";
      const imageUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe";
      const category = "Digital Art";

      await expect(
        artfolio.connect(artist1).publishArtwork(title, description, imageUrl, category)
      )
        .to.emit(artfolio, "ArtworkPublished")
        .withArgs(1, artist1.address, title, category, (ts: bigint) => ts > 0n);

      expect(await artfolio.totalActiveArtworks()).to.equal(1);

      const art = await artfolio.getArtworkById(1);
      expect(art.id).to.equal(1);
      expect(art.author).to.equal(artist1.address);
      expect(art.title).to.equal(title);
      expect(art.description).to.equal(description);
      expect(art.imageUrl).to.equal(imageUrl);
      expect(art.category).to.equal(category);
      expect(art.likesCount).to.equal(0);
      expect(art.exists).to.be.true;
    });

    it("should reject publication with empty fields", async function () {
      await expect(
        artfolio.connect(artist1).publishArtwork("", "Desc", "https://img.url", "Digital Art")
      ).to.be.revertedWith("Title cannot be empty");

      await expect(
        artfolio.connect(artist1).publishArtwork("Title", "Desc", "", "Digital Art")
      ).to.be.revertedWith("Image URL cannot be empty");

      await expect(
        artfolio.connect(artist1).publishArtwork("Title", "Desc", "https://img.url", "")
      ).to.be.revertedWith("Category cannot be empty");
    });
  });

  describe("Artwork Retrieval", function () {
    beforeEach(async function () {
      await artfolio.connect(artist1).publishArtwork("Art 1", "Desc 1", "https://img1.url", "Abstract");
      await artfolio.connect(artist2).publishArtwork("Art 2", "Desc 2", "https://img2.url", "Photography");
      await artfolio.connect(artist1).publishArtwork("Art 3", "Desc 3", "https://img3.url", "3D Art");
    });

    it("should retrieve all active artworks in newest-first order", async function () {
      const artworks = await artfolio.getAllArtworks();
      expect(artworks.length).to.equal(3);
      expect(artworks[0].id).to.equal(3);
      expect(artworks[1].id).to.equal(2);
      expect(artworks[2].id).to.equal(1);
    });

    it("should retrieve artworks by specific author", async function () {
      const artist1Arts = await artfolio.getArtworksByAuthor(artist1.address);
      expect(artist1Arts.length).to.equal(2);
      expect(artist1Arts[0].id).to.equal(3);
      expect(artist1Arts[1].id).to.equal(1);

      const artist2Arts = await artfolio.getArtworksByAuthor(artist2.address);
      expect(artist2Arts.length).to.equal(1);
      expect(artist2Arts[0].id).to.equal(2);
    });
  });

  describe("Liking and Unliking", function () {
    beforeEach(async function () {
      await artfolio.connect(artist1).publishArtwork("Piece 1", "Desc 1", "https://img.url", "Illustration");
    });

    it("should allow users to like an artwork and emit ArtworkLiked", async function () {
      await expect(artfolio.connect(fan1).likeArtwork(1))
        .to.emit(artfolio, "ArtworkLiked")
        .withArgs(1, fan1.address);

      const art = await artfolio.getArtworkById(1);
      expect(art.likesCount).to.equal(1);
      expect(await artfolio.totalPlatformLikes()).to.equal(1);
      expect(await artfolio.hasUserLiked(1, fan1.address)).to.be.true;
    });

    it("should prevent duplicate likes from the same wallet", async function () {
      await artfolio.connect(fan1).likeArtwork(1);

      await expect(artfolio.connect(fan1).likeArtwork(1)).to.be.revertedWith(
        "Artwork already liked by caller"
      );
      expect(await artfolio.totalPlatformLikes()).to.equal(1);
    });

    it("should allow a user to unlike an artwork and emit ArtworkUnliked", async function () {
      await artfolio.connect(fan1).likeArtwork(1);
      expect(await artfolio.totalPlatformLikes()).to.equal(1);

      await expect(artfolio.connect(fan1).unlikeArtwork(1))
        .to.emit(artfolio, "ArtworkUnliked")
        .withArgs(1, fan1.address);

      const art = await artfolio.getArtworkById(1);
      expect(art.likesCount).to.equal(0);
      expect(await artfolio.totalPlatformLikes()).to.equal(0);
      expect(await artfolio.hasUserLiked(1, fan1.address)).to.be.false;
    });

    it("should reject unliking an artwork not liked yet", async function () {
      await expect(artfolio.connect(fan1).unlikeArtwork(1)).to.be.revertedWith(
        "Artwork has not been liked by caller"
      );
    });
  });

  describe("Artwork Removal", function () {
    beforeEach(async function () {
      await artfolio.connect(artist1).publishArtwork("To be deleted", "Desc", "https://img.url", "Abstract");
      await artfolio.connect(fan1).likeArtwork(1);
    });

    it("should allow author to remove their artwork and emit ArtworkRemoved", async function () {
      expect(await artfolio.totalActiveArtworks()).to.equal(1);
      expect(await artfolio.totalPlatformLikes()).to.equal(1);

      await expect(artfolio.connect(artist1).removeArtwork(1))
        .to.emit(artfolio, "ArtworkRemoved")
        .withArgs(1, artist1.address);

      expect(await artfolio.totalActiveArtworks()).to.equal(0);
      expect(await artfolio.totalPlatformLikes()).to.equal(0);

      const all = await artfolio.getAllArtworks();
      expect(all.length).to.equal(0);

      await expect(artfolio.getArtworkById(1)).to.be.revertedWith(
        "Artwork does not exist or removed"
      );
    });

    it("should disallow non-authors from removing artwork", async function () {
      await expect(artfolio.connect(artist2).removeArtwork(1)).to.be.revertedWith(
        "Only author can remove their artwork"
      );
    });
  });

  describe("Platform Stats", function () {
    it("should accurately track stats through multiple operations", async function () {
      await artfolio.connect(artist1).publishArtwork("Art A", "Desc", "https://imgA.url", "Digital Art");
      await artfolio.connect(artist2).publishArtwork("Art B", "Desc", "https://imgB.url", "3D Art");

      await artfolio.connect(fan1).likeArtwork(1);
      await artfolio.connect(artist2).likeArtwork(1);
      await artfolio.connect(artist1).likeArtwork(2);

      let stats = await artfolio.getPlatformStats();
      expect(stats.totalActive).to.equal(2);
      expect(stats.totalLikes).to.equal(3);
      expect(stats.totalEverCreated).to.equal(2);

      // Remove Art 1 (which had 2 likes)
      await artfolio.connect(artist1).removeArtwork(1);

      stats = await artfolio.getPlatformStats();
      expect(stats.totalActive).to.equal(1);
      expect(stats.totalLikes).to.equal(1);
      expect(stats.totalEverCreated).to.equal(2);
    });
  });
});
