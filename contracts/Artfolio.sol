// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Artfolio
 * @notice "Your Art. Your Space."
 * A decentralized digital art-sharing platform where users publish their artwork,
 * discover creative works, and appreciate other artists.
 */
contract Artfolio {
    struct Artwork {
        uint256 id;
        address author;
        string title;
        string description;
        string imageUrl;
        string category;
        uint256 timestamp;
        uint256 likesCount;
        bool exists;
    }

    // Counters
    uint256 private _artworkIdCounter;
    uint256 public totalActiveArtworks;
    uint256 public totalPlatformLikes;

    // Artwork storage: id => Artwork
    mapping(uint256 => Artwork) public artworks;

    // Like tracking: artworkId => user => hasLiked
    mapping(uint256 => mapping(address => bool)) public hasLiked;

    // Author index: author => list of artwork IDs
    mapping(address => uint256[]) private _authorArtworkIds;

    // Events
    event ArtworkPublished(
        uint256 indexed id,
        address indexed author,
        string title,
        string category,
        uint256 timestamp
    );

    event ArtworkLiked(
        uint256 indexed id,
        address indexed user
    );

    event ArtworkUnliked(
        uint256 indexed id,
        address indexed user
    );

    event ArtworkRemoved(
        uint256 indexed id,
        address indexed author
    );

    /**
     * @notice Publish a new artwork to the platform
     * @param title Title of the artwork
     * @param description Narrative or description of the piece
     * @param imageUrl Direct URL to the artwork preview
     * @param category Art category (e.g., Digital Art, Photography, Illustration, Abstract, 3D Art)
     */
    function publishArtwork(
        string memory title,
        string memory description,
        string memory imageUrl,
        string memory category
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(bytes(imageUrl).length > 0, "Image URL cannot be empty");
        require(bytes(category).length > 0, "Category cannot be empty");

        _artworkIdCounter++;
        uint256 newId = _artworkIdCounter;

        artworks[newId] = Artwork({
            id: newId,
            author: msg.sender,
            title: title,
            description: description,
            imageUrl: imageUrl,
            category: category,
            timestamp: block.timestamp,
            likesCount: 0,
            exists: true
        });

        _authorArtworkIds[msg.sender].push(newId);
        totalActiveArtworks++;

        emit ArtworkPublished(newId, msg.sender, title, category, block.timestamp);
        return newId;
    }

    /**
     * @notice Like an artwork. Prevents duplicate likes from the same wallet.
     * @param id Artwork ID to like
     */
    function likeArtwork(uint256 id) external {
        Artwork storage art = artworks[id];
        require(art.exists, "Artwork does not exist or has been removed");
        require(!hasLiked[id][msg.sender], "Artwork already liked by caller");

        hasLiked[id][msg.sender] = true;
        art.likesCount++;
        totalPlatformLikes++;

        emit ArtworkLiked(id, msg.sender);
    }

    /**
     * @notice Unlike an artwork that was previously liked by the caller.
     * @param id Artwork ID to unlike
     */
    function unlikeArtwork(uint256 id) external {
        Artwork storage art = artworks[id];
        require(art.exists, "Artwork does not exist or has been removed");
        require(hasLiked[id][msg.sender], "Artwork has not been liked by caller");

        hasLiked[id][msg.sender] = false;
        if (art.likesCount > 0) {
            art.likesCount--;
        }
        if (totalPlatformLikes > 0) {
            totalPlatformLikes--;
        }

        emit ArtworkUnliked(id, msg.sender);
    }

    /**
     * @notice Remove an artwork. Can only be performed by the author.
     * @param id Artwork ID to remove
     */
    function removeArtwork(uint256 id) external {
        Artwork storage art = artworks[id];
        require(art.exists, "Artwork does not exist or already removed");
        require(art.author == msg.sender, "Only author can remove their artwork");

        art.exists = false;
        if (totalActiveArtworks > 0) {
            totalActiveArtworks--;
        }
        if (totalPlatformLikes >= art.likesCount) {
            totalPlatformLikes -= art.likesCount;
        } else {
            totalPlatformLikes = 0;
        }

        emit ArtworkRemoved(id, msg.sender);
    }

    /**
     * @notice Get all active published artworks
     * @return activeArtworks Array of active Artwork structs
     */
    function getAllArtworks() external view returns (Artwork[] memory) {
        uint256 total = _artworkIdCounter;
        uint256 activeCount = totalActiveArtworks;

        Artwork[] memory items = new Artwork[](activeCount);
        uint256 currentIndex = 0;

        // Iterate backwards so newest artworks appear first
        for (uint256 i = total; i >= 1; i--) {
            if (artworks[i].exists) {
                items[currentIndex] = artworks[i];
                currentIndex++;
                if (currentIndex == activeCount) {
                    break;
                }
            }
        }

        return items;
    }

    /**
     * @notice Retrieve all active artworks published by a specific author
     * @param author Address of the author
     * @return authorArtworks Array of author's active Artwork structs
     */
    function getArtworksByAuthor(address author) external view returns (Artwork[] memory) {
        uint256[] memory ids = _authorArtworkIds[author];
        uint256 activeCount = 0;

        for (uint256 i = 0; i < ids.length; i++) {
            if (artworks[ids[i]].exists) {
                activeCount++;
            }
        }

        Artwork[] memory items = new Artwork[](activeCount);
        uint256 index = 0;
        // In reverse order for newest first
        for (uint256 i = ids.length; i > 0; i--) {
            uint256 currentId = ids[i - 1];
            if (artworks[currentId].exists) {
                items[index] = artworks[currentId];
                index++;
            }
        }

        return items;
    }

    /**
     * @notice Retrieve a single artwork by ID
     * @param id Artwork ID
     */
    function getArtworkById(uint256 id) external view returns (Artwork memory) {
        require(artworks[id].exists, "Artwork does not exist or removed");
        return artworks[id];
    }

    /**
     * @notice Check if a user has liked a specific artwork
     * @param id Artwork ID
     * @param user User address
     */
    function hasUserLiked(uint256 id, address user) external view returns (bool) {
        return hasLiked[id][user];
    }

    /**
     * @notice Retrieve high-level platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalActive,
        uint256 totalLikes,
        uint256 totalEverCreated
    ) {
        return (totalActiveArtworks, totalPlatformLikes, _artworkIdCounter);
    }
}

