var StickerApp = {

	stickers_array: [],

	sticker_containerID: "sticker-book",
	sticker_itemSelector: ".sticker-wrapper",
	sticker_item_innerSelector: ".sticker",

	// shine
	doShine: true,
	shineClass: "shine",
	shineInterval: 3000,

	// shake
	doShake: true,
	sticker_shakeDuration: 1200,
	sticker_shakeInterval: 3000,
	shakeClass: 'temp-shake',

	// layering
	highestZIndex: 0,
	sticker_overlapIterations: 50,

	// overlap, in pixels
	sticker_overlapOffset: 20,
	portrait_overlapOffset: 50,

	// surround Object
	doSurroundObject: true,
	surroundObjectID: "portrait",

	// sparkle
	sparkle_do: false,
	sparkle_itemSelector: ".sparkle",
	sparkle_Interval: 2000,

	// reveal
	doReveal: true,
	revealClassName: "visible",
	initialRevealDelayDuration: 500,
	revealDelayDuration: 150,
	isAccelerated: true,
	accelerationFactor: .9,

	// loading timeout
	loadTimeoutDuration: 2500,
	loadTimeout: null,

	//depth (scaling, shadows)
	doDepth: true,
	depthClassName: "addDepth",

	// starting rotation
	doRotate: true,

	// placement
	doRandomPlacement: true,
	convertToPercent: true,

	// decide if it's a click
	movementThreshold: 5,
	clickDurationThreshold: 125,

	// resize
	resizeDelayDuration: 500,

	init: function () {
		console.log("Init sticker app...");

		let container = document.getElementById(this.sticker_containerID);
		if (container) {
			console.log("Valid container found...");

			// reduce overlap on small screens
			if (this.determineScreenSize() == "small") {
				this.sticker_overlapOffset /= 3;
				this.portrait_overlapOffset /= 3;
			}

			// resize event
			let resizeTimeout;
			window.addEventListener('resize', () => {
				clearTimeout(resizeTimeout);
				resizeTimeout = setTimeout(() => {
					this.onResize();
				}, this.resizeDelayDuration); // Adjust the timeout delay as needed
			});

			// do everything else
			this.stickers_array = container.querySelectorAll(this.sticker_itemSelector);
			this.imagesLoaded = false;
			this.imagesLoadedTimeout = null;
			this.loadImagesWithTimeout();
		}
	},

	onResize() {
		console.log("Resize event executed");
	
		this.refreshStickerPlacement();
	},

	refreshStickerPlacement: function(){
		if (this.doRandomPlacement) {
	
			// remove placed so we can set new locations
			for (let i = 0; i < this.stickers_array.length; i++) {
				this.stickers_array[i].classList.remove('placed');
	
				// remove reveal
				if (this.doReveal) {
					this.stickers_array[i].classList.remove(this.revealClassName);
				}
			}
	
			// rereveal
			if (this.doReveal) {
				setTimeout(() => {
					this.setStickerLocations();
					this.stickers_array.forEach(item => {
						item.classList.add(this.revealClassName);
					});
				}, 350);
			}
		}
	},

	determineOrientation: function () {
		const width = window.innerWidth;
		const height = window.innerHeight;

		const aspectRatio = width / height;

		if (aspectRatio > 1.2) {
			return 'horizontal';
		} else if (aspectRatio < 0.8) {
			return 'vertical';
		} else {
			return 'square';
		}
	},

	determineScreenSize: function () {
		const width = window.innerWidth;

		if (width >= 1024) {
			return 'large'; // Large screen, typically desktop
		} else {
			return 'small'; // Small screen, typically mobile or tablet
		}
	},


	

	loadImagesWithTimeout: function () {
		const images = Array.from(this.stickers_array).map(sticker => sticker.querySelector('img'));
		const imagesToLoad = images.filter(img => img !== null);
	
		if (imagesToLoad.length === 0) {
			// No images to load
			this.imagesLoaded = true;
			this.executeInitFunctions();
		} else {
			let loadedImagesCount = 0;
			this.loadTimeout = null; // Initialize this.loadTimeout to null
	
			const onImageLoadOrError = (isError) => {
				// Increment loadedImagesCount regardless of whether it's an error or load event
				loadedImagesCount++;

				// If all images (including errors) are accounted for, mark images as loaded, clear timeout, and execute initialization functions
				if (loadedImagesCount === imagesToLoad.length) {
					console.log(`${loadedImagesCount} sticker images loaded`);
					this.imagesLoaded = true;
					clearTimeout(this.loadTimeout);
					this.executeInitFunctions();
				}

				// If it's an error event, log an error message
				if (isError) {
					console.error("An error occurred while loading an image.");
				}
			};

			imagesToLoad.forEach(img => {
				if (img.complete) {
					// Image already loaded
					onImageLoadOrError(false); // Pass false for load event
				} else {
					// Image still loading
					img.addEventListener('load', () => onImageLoadOrError(false));
					img.addEventListener('error', () => onImageLoadOrError(true)); // Pass true for error event
				}
			});
	
			// Timeout
			this.loadTimeout = setTimeout(() => {
				if (loadedImagesCount === imagesToLoad.length) {
					console.log("Image loading timeout not needed")
				}else{
					// If timeout is reached, mark images as loaded, execute initialization functions, and log a timeout message
					console.log(`Timeout: ${imagesToLoad.length} - ${loadedImagesCount} images did not load within ${this.loadTimeoutDuration}ms.`);
					this.imagesLoaded = true;
					this.executeInitFunctions();
				}
			}, this.loadTimeoutDuration); 
		}
	},

	executeInitFunctions: function () {
		console.log("Execute init functions");

		if (this.doRandomPlacement) {
			this.setStickerLocations();
		}

		this.makeDraggable();

		if (this.doShake) {
			this.shakeRandomSticker();
			this.setIntervalShake();
		}

		if (this.doShine) {
			this.shineRandomSticker();
			this.setIntervalShine();
		}


		if (this.doReveal) {
			this.revealStickerOneByOne();
		}



		if (this.sparkle_do) {
			setInterval(function () {
				this.SetSparkle();
			}, sparkle_Interval);

			this.setSparkle();
		}

	},



	// Function to reveal stickers one by one
	revealStickerOneByOne: function () {
		let currentDelay = this.initialRevealDelayDuration;

		for (let i = 0; i < this.stickers_array.length; i++) {
			setTimeout(() => {
				this.stickers_array[i].classList.add(this.revealClassName);
			}, currentDelay);

			if (this.isAccelerated) {
				currentDelay += this.revealDelayDuration * Math.pow(this.accelerationFactor, i);
			} else {
				currentDelay += this.revealDelayDuration;
			}
		}
	},



	getRandomInteger: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	convertPixelToPercent: function (val, dimension) {
		return (parseInt(val) / (dimension / 100)) + "%";
	},




	setStickerPlacement: function (sticker) {
		const pageWidth = window.innerWidth;
		const pageHeight = window.innerHeight;

		let validPositionFound = false;
		let attempts = 0;

		while (!validPositionFound && attempts < this.sticker_overlapIterations) {
			attempts++;
			validPositionFound = this.tryPlaceSticker(sticker, pageWidth, pageHeight);
		}

		if (!validPositionFound) {
			console.warn('Max attempts reached, attempting to place sticker without overlap only against no-overlap elements');

			attempts = 0;
			while (!validPositionFound && attempts < this.sticker_overlapIterations) {
				attempts++;
				validPositionFound = this.tryPlaceSticker(sticker, pageWidth, pageHeight, true);
			}

			if (!validPositionFound) {
				console.error('Unable to place sticker without overlapping no-overlap elements');
			}
		}
	},

	tryPlaceSticker: function (sticker, pageWidth, pageHeight, checkNoOverlapOnly = false) {
		const { x, y } = this.calculateRandomPosition(sticker, pageWidth, pageHeight);
		const constrainedPosition = this.constrainPosition(x, y, sticker, pageWidth, pageHeight);
		this.placeSticker(sticker, constrainedPosition.x, constrainedPosition.y);

		const stickerRect = sticker.getBoundingClientRect();
		const noOverlapElements = document.querySelectorAll('.no-overlap');
		const elementsToCheck = checkNoOverlapOnly ? noOverlapElements : document.querySelectorAll('.sticker-wrapper.placed, .no-overlap');

		if (!this.isOverlapDetected(stickerRect, elementsToCheck, checkNoOverlapOnly ? this.portrait_overlapOffset : this.sticker_overlapOffset)) {
			sticker.classList.add('placed');
			return true;
		}
		return false;
	},

	calculateRandomPosition: function (sticker, pageWidth, pageHeight) {
		let x, y;
		if (this.doSurroundObject) {
			const portraitElement = document.getElementById(this.surroundObjectID);
			let maxOffsetX = portraitElement.offsetWidth;
			let maxOffsetY = portraitElement.offsetHeight;

			if (this.determineOrientation() === "vertical") {
				maxOffsetX *= 0.025;
				maxOffsetY *= 0.075;
			} else {
				maxOffsetX *= 0.3;
				maxOffsetY *= 0.1;
			}

			x = this.getRandomInteger(
				portraitElement.offsetLeft - maxOffsetX,
				portraitElement.offsetLeft + portraitElement.offsetWidth + maxOffsetX - sticker.offsetWidth
			);
			y = this.getRandomInteger(
				portraitElement.offsetTop - maxOffsetY,
				portraitElement.offsetTop + portraitElement.offsetHeight + maxOffsetY - sticker.offsetHeight
			);
		} else {
			x = Math.random() * (pageWidth - sticker.offsetWidth);
			y = Math.random() * (pageHeight - sticker.offsetHeight);
		}
		return { x, y };
	},

	constrainPosition: function (x, y, sticker, pageWidth, pageHeight) {
		x = Math.max(0, Math.min(x, pageWidth - sticker.offsetWidth));
		y = Math.max(0, Math.min(y, pageHeight - sticker.offsetHeight));
		return { x, y };
	},

	placeSticker: function (sticker, x, y) {
		if (this.convertToPercent) {
			sticker.style.top = this.convertPixelToPercent(y, window.innerHeight);
			sticker.style.left = this.convertPixelToPercent(x, window.innerWidth);
		} else {
			sticker.style.left = x + 'px';
			sticker.style.top = y + 'px';
		}
	},

	isOverlapDetected: function (stickerRect, elements, offset) {
		for (let element of elements) {
			const elementRect = element.getBoundingClientRect();
			if (this.isOverlap(stickerRect, elementRect, offset)) {
				return true;
			}
		}
		return false;
	},

	isOverlap: function (rect1, rect2, offset) {
		return !(rect1.right < rect2.left + offset ||
			rect1.left > rect2.right - offset ||
			rect1.bottom < rect2.top + offset ||
			rect1.top > rect2.bottom - offset);
	},


	// SHAKE
	shakeSticker: function (element) {
		if (!element.classList.contains(this.shakeClass)) {
			element.classList.add(this.shakeClass);
			element.addEventListener('animationend', () => {
				element.classList.remove(this.shakeClass);
			});
		}
	},

	shakeRandomSticker: function () {
		var random = this.getRandomInteger(0, this.stickers_array.length - 1);
		this.shakeSticker(this.stickers_array[random]);
	},

	setIntervalShake: function () {
		setInterval(() => {
			this.shakeRandomSticker();
		}, this.sticker_shakeInterval);
	},
	
	setIntervalShine: function () {
		setInterval(() => {
			this.shineRandomSticker();
		}, this.shineInterval);
	},

	shineRandomSticker: function () {
		var random = this.getRandomInteger(0, this.stickers_array.length - 1);
		this.shineSticker(this.stickers_array[random]);
	},


	shineSticker: function (element) {
		if (!element.classList.contains(this.shineClass)) {
			element.classList.add(this.shineClass);
			element.addEventListener('animationend', () => {
				element.classList.remove(this.shineClass);
			});
		}
	},

	setStickerLocations: function () {
		this.stickers_array.forEach((item) => {
			if (this.doRotate) this.setRandomRotation(item.querySelector(this.sticker_item_innerSelector));
			item.style.zIndex = this.highestZIndex; // Use 'this' instead of 'self'
			this.highestZIndex++;
			this.setStickerPlacement(item, 0);
		});
	},

	// Function to generate a random number within a specified range
	getRandomNumber: function (min, max) {
		return Math.random() * (max - min) + min;
	},

	maxRotation: 25,

	// Function to set random rotation to an element
	setRandomRotation: function (element) {
		// Get the existing transform value
		var existingTransform = element.style.transform;

		// Extract the existing rotation value if it exists
		var existingRotation = 0;
		var match = existingTransform.match(/rotate\(([-+]?\d+deg)\)/);
		if (match) {
			existingRotation = parseInt(match[1]);
		}

		// Generate a random rotation value between -maxRotation and maxRotation
		var additionalRotation = this.getRandomNumber(-this.maxRotation, this.maxRotation);

		// Calculate the new rotation including existing rotation
		var totalRotation = existingRotation + additionalRotation;

		// Apply the new rotation to the element's style
		element.style.transform = "rotate(" + totalRotation + "deg)";
	},

	makeDraggable: function () {
		var self = this; // Store a reference to 'this'

		this.stickers_array.forEach(function (item) {

			var clickStartTime; // Variable to store the start time of the click
			var clickEndTime; // Variable to store the end time of the click
			let rafId;


			item.addEventListener("mousedown", startDrag, { passive: false });
			item.addEventListener("touchstart", startDrag, { passive: false });

			// add draggable class
			item.classList.add("draggable");

			// Make it already visible if not doing
			if (self.doReveal == false) {
				item.classList.add(self.revealClassName);
			}

			// Make it already visible if not doing
			if (self.doDepth == true) {
				item.classList.add(self.depthClassName);
			}

			function startDrag(event) {
				//event.preventDefault(); // Prevent default touch behavior

				// add dragging class
				item.classList.add("dragging");

				var isTouch = event.type === "touchstart";
				var offsetX, offsetY;

				clickStartTime = new Date().getTime(); // Record the start time of the click

				// Record initial position
				var initialLeft = parseFloat(item.style.left);
				var initialTop = parseFloat(item.style.top);

				// Get positions and dimensions
				var rect = item.getBoundingClientRect();
				var stickerBookRect = document.getElementById(self.sticker_containerID).getBoundingClientRect();

				// Get scroll positions and client offsets

				var clientTop = document.documentElement.clientTop || 0;
				var clientLeft = document.documentElement.clientLeft || 0;

				// Calculate offsets based on touch or mouse event
				var eventPos = isTouch ? event.touches[0] : event;
				var offsetX = eventPos.clientX - rect.left + stickerBookRect.left - clientLeft;
				var offsetY = eventPos.clientY - rect.top + stickerBookRect.top - clientTop;

				// z-index stuff
				self.highestZIndex += 1;
				item.style.zIndex = self.highestZIndex;

				function elementDrag(e) {
					if (rafId) return;
					rafId = window.requestAnimationFrame(() => onElementDrag(e));
				}

				function onMove(event) {
					event.preventDefault(); // Prevent default touch behavior



					var x, y;

					if (isTouch) {
						var touch = event.touches[0];
						x = touch.clientX - offsetX;
						y = touch.clientY - offsetY;
					} else {
						x = event.clientX - offsetX;
						y = event.clientY - offsetY;
					}

					if (x < 0) x = 0;
					if (y < 0) y = 0;
					if (x + item.offsetWidth > window.innerWidth) x = window.innerWidth - item.offsetWidth;
					if (y + item.offsetHeight > window.innerHeight) y = window.innerHeight - item.offsetHeight - 1;

					item.style.left = x + "px";
					item.style.top = y + "px";

					rafId = null;
				}

				function onEnd() {
					// event.preventDefault();
					event.preventDefault(); // Prevent default touch behavior

					document.removeEventListener(isTouch ? "touchmove" : "mousemove", onMove);
					document.removeEventListener(isTouch ? "touchend" : "mouseup", onEnd);

					item.classList.remove("dragging");

					clickEndTime = new Date().getTime(); // Record the end time of the click
					var clickDuration = clickEndTime - clickStartTime; // Calculate the duration of the click

					// Log click duration
					console.log("Click duration:", clickDuration);

					// Record final position
					var finalLeft = parseFloat(item.style.left);
					var finalTop = parseFloat(item.style.top);

					// Calculate distance moved
					var distanceX = Math.abs(finalLeft - initialLeft);
					var distanceY = Math.abs(finalTop - initialTop);
					var distance = Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)); // Euclidean distance

					// Log distance moved
					console.log("Distance moved:", distance);

					// Check if distance is too low
					if (distance < self.movementThreshold || clickDuration < self.clickDurationThreshold) {
						console.log("Distance moved is too low.");

						var linkElement = event.target.querySelector("a");
						if (linkElement && event.button !== 2) {
							console.log(linkElement);
							// If a link element is found, navigate to it
							window.location.href = linkElement.href;
						}

						// Log message to your log
					} else {
						// Set percentage
						if (self.convertToPercent == true) {
							item.style.left = self.convertPixelToPercent(item.style.left, window.innerWidth);
							item.style.top = self.convertPixelToPercent(item.style.top, window.innerHeight);
						}
					}
				}

				document.addEventListener(isTouch ? "touchmove" : "mousemove", onMove, { passive: false });
				document.addEventListener(isTouch ? "touchend" : "mouseup", onEnd, { passive: false });
			}
		});
	},

	setSparkle: function (sparkle_itemName) {
		var newx = getRandomInteger(0, window.innerWidth - $(sparkle_itemName).width());
		var newy = getRandomInteger(0, window.innerHeight - $(sparkle_itemName).height());

		// Limit to bounds
		if (newx + $(sparkle_itemName).width() > window.innerWidth) newx = window.innerWidth - $(sparkle_itemName).width();
		if (newx + $(sparkle_itemName).width() <= 0) newx = 0;
		if (newy + $(sparkle_itemName).height() > window.innerHeight) newy = window.innerHeight - $(sparkle_itemName).height();
		if (newy + $(sparkle_itemName).height() <= 0) newy = 0;

		// Pixel to Percentage Conversion

		$(sparkle_itemName).css('top', convertPixelToPercent(newy, window.innerHeight));
		$(sparkle_itemName).css('left', convertPixelToPercent(newx, window.innerWidth));

		// Reload Image
		var d = new Date();
		var new_url = "images/particle/sparkle-playonce.png";
		$(sparkle_itemName).find("img").attr("src", new_url + "?" + d.getTime());
	},

	convertPixelToPercent: function (pixelValue, containerWidth) {
		var pixel = parseFloat(pixelValue);
		var percent = (pixel / containerWidth) * 100;
		return percent + "%";
	},
};

StickerApp.init();
