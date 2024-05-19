var StickerApp = {

	isActive: true,
	stickers_array: [],

	// sticker classes
	sticker_containerID: "sticker-book",
	sticker_itemSelector: ".sticker-wrapper",
	sticker_item_innerSelector: ".sticker",
	activeStickerClass: 'placed',
	noOverlapClass: 'no-overlap',

	// draggable
	doDraggable: false,

	// layering
	highestZIndex: 0,
	sticker_overlapIterations: 50,

	// shine
	doShine: true,
	shineClass: "shine",
	shineInterval: 3000,

	// shake
	doShake: true,
	sticker_shakeDuration: 1200,
	sticker_shakeInterval: 3000,
	shakeClass: 'temp-shake',

	// sparkle
	doSparkle: false,
	sparkle_itemSelector: ".sparkle",
	sparkle_Interval: 2000,

	// overlap, in pixels
	sticker_overlapOffset: 20,
	portrait_overlapOffset: 50,

	// surround Object
	doSurroundObject: true,
	surroundObjectID: "portrait",

	// reveal
	doReveal: true,
	revealClassName: "visible",
	initialRevealDelayDuration: 500,
	revealDelayDuration: 150,
	isAccelerated: true,
	accelerationFactor: .9,

	// loading timeout
	loadTimeoutDuration: 2500,
	loadTimeout: null, // the timeout function

	// depth (scaling, shadows)
	doDepth: true,
	depthClassName: "addDepth",

	// starting rotation
	doRotate: true,
	maxStickerRotation: 25, // in degrees

	// placement
	doRandomPlacement: true,
	convertToPercent: true,

	// decide if it's a click
	movementThreshold: 5,
	clickDurationThreshold: 125,

	// page size / resize
	resizeDelayDuration: 500,
	lastWindowSize: null,
	windowOrientation: null,
	deviceType: null,
	resizeThreshold: 250,
	doResetOnRefresh: true,

	init: function () {
		console.log("Init sticker app...");

		let container = document.getElementById(this.sticker_containerID);
		if (container) {
			console.log("Valid container found...");
			this.setWindowSize();
			this.setResizeListener();
			this.setActiveListener();
			this.setRefreshButton();
			this.initStickers(container);
		}
	},

	setWindowSize: function () {
		this.lastWindowSize = {
			width: window.innerWidth,
			height: window.innerHeight
		};

		this.windowOrientation = this.getWindowOrientation();
		this.deviceType = this.getDeviceType();
	},

	getWindowOrientation: function () {
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

	getDeviceType: function () {
		const width = window.innerWidth;

		if (width >= 1024) {
			return 'desktop'; // Large screen, typically desktop
		} else {
			return 'mobile'; // Small screen, typically mobile or tablet
		}
	},

	setResizeListener: function () {
		let resizeTimeout;
		window.addEventListener('resize', () => {
			clearTimeout(resizeTimeout);
			resizeTimeout = setTimeout(() => {
				const currentWindowSize = {
					width: window.innerWidth,
					height: window.innerHeight
				};

				if (Math.abs(currentWindowSize.width - this.lastWindowSize.width) >= this.resizeThreshold ||
					Math.abs(currentWindowSize.height - this.lastWindowSize.height) >= this.resizeThreshold) {
					this.lastWindowSize = currentWindowSize;
					this.onResize();
				} else {
					console.log("Did not meet resize threshold");
				}

				// set window size here because the screensize changed regardless if it met the threshold
				this.setWindowSize();

			}, this.resizeDelayDuration);
		});
	},

	setActiveListener: function () {
		document.addEventListener('visibilitychange', () => {
			this.isActive = !document.hidden;
			console.log("Document Active: ", this.isActive);
		});
	},

	setRefreshButton: function () {
		var button = document.getElementById('refreshButton');
		if (button) {
			// delay visibility
			setTimeout(() => {
				button.classList.add('visible');
			}, 2500);

			// add click event
			button.addEventListener('click', () => {
				this.onRefreshButtonClick(button);
			});
		}
	},

	onRefreshButtonClick: function (button) {

		if (!button.classList.contains('spin')) { // Check if the button is not spinning
			button.blur();

			button.classList.add('spin');

			button.addEventListener('animationend', () => {
				button.classList.remove('spin');
				this.refreshStickerPlacement();
			}, { once: true });
		}
	},

	initStickers: function (container) {
		this.stickers_array = container.querySelectorAll(this.sticker_itemSelector);
		this.imagesLoaded = false;
		this.imagesLoadedTimeout = null;
		this.loadImagesWithTimeout();
	},

	onResize() {
		console.log("Resize event executed");
		if (this.doResetOnRefresh) document.getElementById('refreshButton').click();
	},

	refreshStickerPlacement: function () {
		if (this.doRandomPlacement) {

			// remove placed so we can set new locations
			for (let i = 0; i < this.stickers_array.length; i++) {
				this.stickers_array[i].classList.remove(this.activeStickerClass);

				// remove reveal class
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

	loadImagesWithTimeout: function () {
		const images = Array.from(this.stickers_array).map(sticker => sticker.querySelector('img'));
		const imagesToLoad = images.filter(img => img !== null);

		if (imagesToLoad.length === 0) {
			// No images to load
			this.imagesLoaded = true;
			this.initStickerFunctions();
		} else {
			let loadedImagesCount = 0;
			this.loadTimeout = null;

			const onImageLoadOrError = (isError) => {
				// Increment loadedImagesCount regardless of whether it's an error or load event
				loadedImagesCount++;

				// If all images (including errors) are accounted for, mark images as loaded, clear timeout, and execute initialization functions
				if (loadedImagesCount === imagesToLoad.length) {
					console.log(`${loadedImagesCount} sticker images loaded`);
					this.imagesLoaded = true;
					clearTimeout(this.loadTimeout);
					this.initStickerFunctions();
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
				} else {
					// If timeout is reached, mark images as loaded, execute initialization functions, and log a timeout message
					console.log(`Timeout: ${imagesToLoad.length} - ${loadedImagesCount} images did not load within ${this.loadTimeoutDuration}ms.`);
					this.imagesLoaded = true;
					this.initStickerFunctions();
				}
			}, this.loadTimeoutDuration);
		}
	},

	initStickerFunctions: function () {
		console.log("Execute init functions");

		if (this.doRandomPlacement) {
			this.setStickerLocations();
		}

		if(this.doDraggable){
			this.makeDraggable();
		}
		
		if (this.doShake) {
			this.shakeRandomSticker();
			this.setShakeInterval();
		}

		if (this.doShine) {
			this.shineRandomSticker();
			this.setIntervalShine();
		}

		if (this.doSparkle) {
			this.setSparkle();
			this.setSparkleInterval();
		}

		if (this.doReveal) {
			this.revealStickerOneByOne();
		}

	},


	/**********
	*
	*  SHAKE
	*
	**********/
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

	setShakeInterval: function () {
		setInterval(() => {
			if (this.isActive) this.shakeRandomSticker();
		}, this.sticker_shakeInterval);
	},

	/************
	*
	*  SPARKLE
	*
	************/
	setSparkle: function (sparkle_itemName) {
		var sparkleItem = document.querySelector(sparkle_itemName);
		var sparkleWidth = sparkleItem.offsetWidth;
		var sparkleHeight = sparkleItem.offsetHeight;
		var windowWidth = window.innerWidth;
		var windowHeight = window.innerHeight;

		var newx = getRandomInteger(0, windowWidth - sparkleWidth);
		var newy = getRandomInteger(0, windowHeight - sparkleHeight);

		// Clamp values to bounds
		newx = Math.max(0, Math.min(newx, windowWidth - sparkleWidth));
		newy = Math.max(0, Math.min(newy, windowHeight - sparkleHeight));

		// Pixel to percentage conversion
		sparkleItem.style.top = convertPixelToPercent(newy, windowHeight);
		sparkleItem.style.left = convertPixelToPercent(newx, windowWidth);

		// Reload Image
		var newUrl = "images/particle/sparkle-playonce.png?" + new Date().getTime();
		sparkleItem.querySelector("img").src = newUrl;
	},

	setSparkleInterval: function () {
		setInterval(() => {
			if (this.isActive) this.SetSparkle();
		}, this.sparkle_Interval);
	},

	/**********
	*
	*  SHINE
	*
	**********/
	setIntervalShine: function () {
		setInterval(() => {
			if (this.isActive) this.shineRandomSticker();
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
		const noOverlapSelector = `.${this.noOverlapClass}`;
		const placedSelector = `${this.sticker_itemSelector}.${this.activeStickerClass}`;
		const elementsToCheck = checkNoOverlapOnly ? document.querySelectorAll(noOverlapSelector) : document.querySelectorAll(`${placedSelector}, ${noOverlapSelector}`);

		let temp_sticker_overlap = this.sticker_overlapOffset;
		let temp_portrait_overlap = this.portrait_overlapOffset;

		// reduce overlap on mobile because stickers are smaller
		if (this.deviceType == "mobile") {
			temp_sticker_overlap /= 3;
			temp_portrait_overlap /= 3;
		}

		if (!this.isOverlapDetected(stickerRect, elementsToCheck, checkNoOverlapOnly ? temp_portrait_overlap : temp_sticker_overlap)) {
			sticker.classList.add(this.activeStickerClass);
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

			if (this.windowOrientation === "vertical") {
				// mobile
				maxOffsetX *= 0.025;
				maxOffsetY *= 0.075;
			} else if (this.windowOrientation === "horizontal") {
				// desktop
				maxOffsetX *= 0.3;
				maxOffsetY *= 0.1;
			} else {
				// square
				maxOffsetX *= 0.05;
				maxOffsetY *= 0.05;

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

	setStickerLocations: function () {
		this.stickers_array.forEach((item) => {
			if (this.doRotate) this.setRandomRotation(item.querySelector(this.sticker_item_innerSelector));
			item.style.zIndex = this.highestZIndex; // Use 'this' instead of 'self'
			this.highestZIndex++;
			this.setStickerPlacement(item, 0);
		});
	},

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
		var additionalRotation = this.getRandomFloat(-this.maxStickerRotation, this.maxStickerRotation);

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

			item.addEventListener("mousedown", startDrag, { passive: false });
			item.addEventListener("touchstart", startDrag, { passive: false });

			// add draggable class
			item.classList.add("draggable");

			// Make it already visible if not doing a reveal
			if (self.doReveal == false) {
				item.classList.add(self.revealClassName);
			}

			// add depth
			if (self.doDepth == true) {
				item.classList.add(self.depthClassName);
			}

			function startDrag(event) {

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
					if (y + item.offsetHeight > window.innerHeight) y = window.innerHeight - item.offsetHeight;

					item.style.left = x + "px";
					item.style.top = y + "px";
				}

				function onEnd(event) {
					event.preventDefault(); // Prevent default touch behavior

					// done dragging so remove everything related to that
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
						console.log("Distance moved or duration below threshold - register as click");

						var linkElement = event.target.querySelector("a");

						// if it's not a right click
						if (linkElement && event.button !== 2) {
							console.log(linkElement);
							// If a link element is found, navigate to it
							window.location.href = linkElement.href;
						}

						// Log message to your log
					} else {
						// it was not a click - Set percentage if needed
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

	getRandomInteger: function (min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	},

	getRandomFloat: function (min, max) {
		return Math.random() * (max - min) + min;
	},

	calculateDistance: function (x1, y1, x2, y2) {
		const distanceX = Math.abs(x2 - x1);
		const distanceY = Math.abs(y2 - y1);
		return Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2));
	},

	convertPixelToPercent: function (pixelValue, containerWidth) {
		var pixel = parseFloat(pixelValue);
		var percent = (pixel / containerWidth) * 100;
		return percent + "%";
	},
};

StickerApp.init();
