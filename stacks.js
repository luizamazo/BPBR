let fs = require('fs'),
    path = require('path'),
    Twit = require('twit'),
    config = require(path.join(__dirname, 'config.js')),
    twitter = require('./twitter/utils.js');
    twit = new Twit(config);
 
  fs.readdir(__dirname + '/media', function(err, files){
  
    if(err){
        console.log(err)
    }else{
        let media = []
        files.forEach(function(file){
            media.push(file)
        })
    
    master(media)
      
    }
})

let master = async (media) => {


      mediaPath = [],
      mediaType = '',
      mediaIdStrings = [],
      mediaIdStringVideo = '',
      mediaInfo = {},
      media_id = '',
      tweet_id = '',
  
      tweet = `|POST| inferno: `

     for(const[index, file] of media.entries()){
        mediaPath = path.join(__dirname, '/media/' + file) 
        mediaType = getMediaType(mediaPath)
        mediaInfo = await uploadChunkedMedia(mediaPath, mediaType)
     
    
      if(mediaInfo.video) {
        mediaIdStringVideo = mediaInfo.media_id_string

        if(mediaIdStrings.length > 0 && mediaIdStrings.length < 4){
          if(tweet_id == ''){
            console.log('first tweet has images')
            await postTweet(tweet, null, mediaIdStrings)
              .then(res => {
                tweet_id = res
              })
          }else{
            console.log('tweet with images comes before any video')
            await postTweet(tweet, tweet_id, mediaIdStrings)
              .then(res => {
                tweet_id = res
              })
          }
        }

        if(mediaPath.includes('1 -')){
          console.log('first tweet will contain a video')
          await postTweet(tweet, null, mediaIdStringVideo)
            .then(res => {
              tweet_id = res
            })
        }else{
          console.log('video is not the first one, it belongs to a thread')
          await postTweet(tweet, tweet_id, mediaIdStringVideo)
            .then(res => {
              tweet_id = res
            })
        }
      }else{
        console.log('to push image media_id', mediaIdStrings)
        mediaIdStrings.push(mediaInfo.media_id_string)
      }

      if(mediaIdStrings.length == 4){
        if(tweet_id == ''){
          console.log('first tweet contains 4 pics')
          await postTweet(tweet, null, mediaIdStrings)
            .then(res => {
              tweet_id = res
            })
        }else{
          console.log('the pics belongs to a thread')
          await postTweet(tweet, tweet_id, mediaIdStrings)
            .then(res => {
              tweet_id = res
            })
        }
        mediaIdStrings = []
      }

      if(index == media.length - 1){
        if(tweet_id != ''){
          console.log('post remaining images that dont fit the ifs')
          await postTweet(tweet, tweet_id, mediaIdStrings)
            .then(res => {
              tweet_id = res
            })
        }else{
          await postTweet(tweet, null, mediaIdStrings)
        }
      }

      console.log(`
      index: ${index},
      mediaPath: ${mediaPath} | mediaType: ${mediaType},
      mediaId - IMG: ${mediaIdStrings},
      mediaId - VIDEO: ${mediaIdStringVideo},
      tweetId: ${tweet_id},
    `)
    

    }
}

 const uploadChunkedMedia = async (mediaPath, mediaType) => { 
  let mediaData = fs.readFileSync(mediaPath, {encoding:'base64'}),
  mediaSize = fs.statSync(mediaPath).size,
  mediaInfo = {}

  await initUpload(mediaSize, mediaType)
    .then(async mediaId => {
      await appendUpload(mediaData, mediaId)
      .then(async mediaId => {
        await finalizeUpload(mediaId)
        .then(async response => {
          if(!response.processing_info){
            mediaInfo = response
          }else{
            if(response.processing_info.state == 'pending' || response.processing_info.state == 'in_progress'){
              await checkStatus(response.media_id_string).then(res => {
                mediaInfo = res
              })
            }
          }
        })
      })
    }) 
  return mediaInfo
 }

 const initUpload = async (mediaSize, mediaType) => {
  let mediaCategory = '' 
  if(mediaType == 'video/mp4'){
     mediaCategory = 'TWEET_VIDEO'
   }else{
     mediaCategory = 'TWEET_IMAGE'
   }
  return await twitter.makePost('media/upload', {
    command    : 'INIT',
    total_bytes: mediaSize,
    media_type : mediaType,
    media_category: mediaCategory
  }).then(result => {
    console.log('media', mediaCategory)
    return result.data.media_id_string
  }).catch(err => {
    console.log('erro no init upload', err)
  })
}

const appendUpload = async (mediaData, mediaId) => {

  return await twitter.makePost('media/upload', {
    command      : 'APPEND',
    media_id     : mediaId,
    media        : mediaData,
    segment_index: 0
  }).then(data => mediaId).catch(err => {
    console.log('erro no init upload', err)
  })
}


const finalizeUpload = async (mediaId) => {
  return await twitter.makePost('media/upload', {
    command : 'FINALIZE',
    media_id: mediaId
  }).then(result => {
    return result.data
  }).catch(err => {
    console.log('erro no init upload', err)
  })
}

const checkStatus = async (mediaId) => {
  let data = {},
  inferno = true
 console.log(mediaId)
  while(inferno){
    
    await twitter.getSomething('media/upload', {
      command      : 'STATUS',
      media_id     : mediaId,
    }).then(result => {
     
      console.log('checando inicialmente', result.data)
  
      if(result.data.processing_info.state == 'succeeded'){
        data = result.data 
        inferno = false
       }else if(result.data.processing_info.state == 'failed'){
        data = {error: 'deu ruim'} 
        inferno = false
       }
    }).catch(err => {
      console.log('erro no init upload', err)
    })   
  }
 
  return data
  
}

const getMediaType = (mediaPath) => {
  let mediaType = ''
  fileExtension = mediaPath.substr((mediaPath.lastIndexOf('.') + 1))
      
  if(fileExtension == 'mp4'){
      mediaType = 'video/mp4'
  }else if(fileExtension == 'gif'){
      mediaType = 'image/gif'
  }else{
      mediaType = 'image/jpeg'
  }

  return mediaType
}

let postTweet = async (status, in_reply_to_status_id = null, media_ids = null)=> {

  return await twitter.makePost('statuses/update', {
    status,
    in_reply_to_status_id,
    auto_populate_reply_metadata: true,
    media_ids
  }).then(res => {
    
      return res.data.id_str
    })
}

