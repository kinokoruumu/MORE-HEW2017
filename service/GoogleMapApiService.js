const param = require('jquery-param');
const request = require("request");
const async = require('async');
const im = require("./InstanceManager");

let placeNameOrigin = placeNameDestination = null

let searchRadius = null

const PHOTO_MAX_WIDTH = 400;
const SUCCESS_STATUS_CODE = 200;

function GoogleMapApiService(){

	var repository = im.getRepository()

	this.key = repository.token
	this.travel_mode = {
		walk: "walking",
		drive: "driving"
	}
	this.originAndDestinationLatLng = []
}

/**
 *	init
 *	最初に実行する関数
 */
GoogleMapApiService.prototype.init = function(origin,destination,radius){
	const self = this

	placeNameOrigin = origin
	placeNameDestination = destination

	searchRadius = radius

	const promiseProcess = new Promise(function(resolve,reject){

		async.series([
			self.getOriginLatlng,
			self.getDestinationLatlng
		],function(err, results){
			if (err) reject(err);
			self.originAndDestinationLatLng = results
			self.getDirections(resolve,results);
		})

	})

	return promiseProcess
}

/**
 *	getOriginAndDestinationLatLng
 *	位置情報を返す
 *
 *	@return { Array } originAndDestinationLatLng
 */
GoogleMapApiService.prototype.getOriginAndDestinationLatLng = function(){
	return this.originAndDestinationLatLng;
}

/**
 *	getShopDetail
 *	お店の詳細画面を取得
 *
 *	@param { string } placeId
 */
GoogleMapApiService.prototype.getShopDetail = function(placeId){

	var repository = im.getRepository()

	/**
	 *	photoReferenceToImageUrl
	 *
	 *	@param { string }	photo_reference
	 *	@return { string } url
	 */
	const photoReferenceToImageUrl = function(photo_reference){
		const params = param({
			maxwidth: PHOTO_MAX_WIDTH,
			photoreference: photo_reference,
			key: repository.token
		})

		const url = "https://maps.googleapis.com/maps/api/place/photo?"+params

		return url
	}

	const promiseProcess = new Promise(function(resolve,reject){

		const self = this

		const params = param({
			key: repository.token,
			placeid: placeId,
			language: "ja"
		})

		const options = {
			url: "https://maps.googleapis.com/maps/api/place/details/json?"+params,
			json: true
		}

		request.get(options,function(err,response,body){
			if(!err && response.statusCode == SUCCESS_STATUS_CODE){
				const results = body.result;

				if(!results){
					resolve({})
					return;
				}
				
				let photosArray = []
				if(results.photos.length > 0){
					results.photos.map(function(photo){
						photosArray.push(photoReferenceToImageUrl(photo.photo_reference))
					})
				}

				const shopDetailObject = {
					name: results.name,
					address: results.vicinity,
					tel: results.formatted_phone_number ? results.formatted_phone_number : null,
					openingHours: results.opening_hours ? results.opening_hours.weekday_text : null,
					rate: results.rating,
					reviews: results.reviews,
					website: results.website ? results.website : null,
					gmapUrl: results.url,
					images: photosArray.length > 0 ? photosArray : [],
					location: results.geometry.location,
					placeId: results.place_id
				}

				resolve(shopDetailObject)

			}
		})

	})

	return promiseProcess

}

/**
 *	getMypageShopDetail
 *	お店の詳細画面を取得
 *
 *	@param { string } placeId
 */
GoogleMapApiService.prototype.getMypageShopDetail = function(placeId,callback){

	var repository = im.getRepository()

	/**
	 *	photoReferenceToImageUrl
	 *
	 *	@param { string }	photo_reference
	 *	@return { string } url
	 */
	const photoReferenceToImageUrl = function(photo_reference){
		const params = param({
			maxwidth: PHOTO_MAX_WIDTH,
			photoreference: photo_reference,
			key: repository.token
		})

		const url = "https://maps.googleapis.com/maps/api/place/photo?"+params

		return url
	}

	const self = this

	const params = param({
		key: repository.token,
		placeid: placeId,
		language: "ja"
	})

	const options = {
		url: "https://maps.googleapis.com/maps/api/place/details/json?"+params,
		json: true
	}

	request.get(options,function(err,response,body){
		if(!err && response.statusCode == SUCCESS_STATUS_CODE){
			const results = body.result;

			if(!results){
				callback(null,{})
				return;
			}
			
			let photosArray = []
			if(results.photos.length > 0){
				results.photos.map(function(photo){
					photosArray.push(photoReferenceToImageUrl(photo.photo_reference))
				})
			}

			const shopDetailObject = {
				name: results.name,
				tel: results.formatted_phone_number ? results.formatted_phone_number : null,
				placeId: results.place_id
			}

			callback(null,shopDetailObject)

		}
	})

}



/**
 *	getMypageShopData
 *	マイページのお店情報を取得
 *
 *	@param { string } placeId
 */
GoogleMapApiService.prototype.getMypageShopData = function(placeIdArray){

	var repository = im.getRepository()

	var self = this

	/**
	 *	photoReferenceToImageUrl
	 *
	 *	@param { string }	photo_reference
	 *	@return { string } url
	 */
	const photoReferenceToImageUrl = function(photo_reference){
		const params = param({
			maxwidth: PHOTO_MAX_WIDTH,
			photoreference: photo_reference,
			key: repository.token
		})

		const url = "https://maps.googleapis.com/maps/api/place/photo?"+params

		return url
	}

	const promiseProcess = new Promise(function(resolve,reject){

		const AsyncGetPlace = {
			getDetail: self.getMypageShopDetail
		}

		async.map(placeIdArray,AsyncGetPlace.getDetail,function(err,results){
			if(err) console.log(err);
			resolve(results)
		})

	})

	return promiseProcess

}

/**
 *	getPlace
 *	位置情報からお店の情報を取得する
 *
 *	@param { string } latlng
 */
GoogleMapApiService.prototype.getPlace = function(latlng,callback){

	var repository = im.getRepository()

	/**
	 *	photoReferenceToImageUrl
	 *
	 *	@param { string }	photo_reference
	 *	@return { string } url
	 */
	const photoReferenceToImageUrl = function(photo_reference){

		const params = param({
			maxwidth: PHOTO_MAX_WIDTH,
			photoreference: photo_reference,
			key: repository.token
		})

		const url = "https://maps.googleapis.com/maps/api/place/photo?"+params

		return url
	}

	const self = this;

	const params = param({
		location: latlng,
		radius: searchRadius,
		types: "food",
		language: "ja",
		key: repository.token
	});

	const options = {
		url: "https://maps.googleapis.com/maps/api/place/nearbysearch/json?"+params,
		json: true
	};

	request.get(options,function(err,response,body){
		if(!err && response.statusCode == SUCCESS_STATUS_CODE){
			let results = []
			body.results.map(function(item){
				if(item.rating && item.photos && item.opening_hours){

					results.push({
						shopName: item.name,
						location: item.geometry.location,
						rating: item.rating,
						placeId: item.place_id,
						image: photoReferenceToImageUrl(item.photos[0].photo_reference),
						openNow: item.opening_hours.open_now,
						genre: "food",
						sortId: null
					})

				}
			})

			callback(null,results)

		}
	})
}

/**
 *	getDirections
 *	二点間の情報を取得
 *
 *	@param { array } results
 */
GoogleMapApiService.prototype.getDirections = function(resolve,results){
	const self = this

	var repository = im.getRepository()

	repository.instance.directions({
		origin: results[0],
		destination: results[1],
		mode: self.travel_mode.walk,
		language: "ja"
	},function(err,response){
		if(err) console.log(err);

		const AsyncGetPlace = {
			getPlace: self.getPlace
		}

		var
			stepsArray = [],
			tmpArray = response.json.routes[0].legs[0].steps;

			for(let i = 0; i < tmpArray.length; i++){
				var ll = tmpArray[i].end_location
				stepsArray.push([ll.lat,ll.lng].join(","))
			}

			async.map(stepsArray,AsyncGetPlace.getPlace,function(err,results){
				if(err) console.log(err);
				resolve(results)
			})
	})
}

/**
 *	getOriginLatlng
 *	出発地点の位置情報
 *
 *	@param { function } callback 
 */
GoogleMapApiService.prototype.getOriginLatlng = function(callback){
	const self = this

	var repository = im.getRepository()

	repository.instance.geocode({
		address: placeNameOrigin,
		language: "ja"
	},function(err,response){
		if (err) console.log(err);
		let latlng = response.json.results[0].geometry.location
		latlng = new Array(latlng.lat,latlng.lng)
		console.log(`[GET] origin: ${latlng}`)
		callback(null,latlng);
	})
}

/**
 *	getDestinationLatlng
 *	目的地点の位置情報
 *
 *	@param { function } callback 
 */
GoogleMapApiService.prototype.getDestinationLatlng = function(callback){
	var self = this

	var repository = im.getRepository()

	repository.instance.geocode({
		address: placeNameDestination,
		language: "ja"
	},function(err,response){
		if (err) console.log(err);
		let latlng = response.json.results[0].geometry.location
		latlng = new Array(latlng.lat,latlng.lng)
		console.log(`[GET] destination: ${latlng}`)
		callback(null,latlng);
	})
}

module.exports = new GoogleMapApiService()