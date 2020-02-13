let master = async (media) => {
      for(const[index, file] of media.entries()){
        mediaPath = path.join(__dirname, '/media/' + file) 
        mediaType = getMediaType(mediaPath)
        mediaInfo = await uploadChunkedMedia(mediaPath, mediaType)
        
        console.log(`
        index: ${index},
        tweet_id: ${tweet_id}
        `)

        if(mediaInfo.video){
          mediaIdStringVideo = mediaInfo.media_id_string
          if(mediaPath.includes('1 -')){
            tweet_id = await postTweet(tweet, null, mediaIdStringVideo)
          }else{
            tweet_id = await postTweet(tweet, tweet_id, mediaIdStringVideo)
          }
        }
    
      }
}

 
 
 const uploadChunkedMedia = async (mediaPath, mediaType) => { 
  let mediaData = fs.readFileSync(mediaPath, {encoding:'base64'}),
  mediaSize = fs.statSync(mediaPath).size,
  mediaInfo = {}

  await initUpload(mediaSize, mediaType)
    .then(async res1 => {
      await appendUpload(mediaData, res1)
      .then(async res2 => {
        await finalizeUpload(res2)
        .then(async res3 => {
          mediaInfo = res3
        })
      })
    }) 
  return mediaInfo
 }

 const initUpload = async (mediaSize, mediaType) => {
  return await twitter.makePost('media/upload', {
    command    : 'INIT',
    total_bytes: mediaSize,
    media_type : mediaType,
  }).then(result => {
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

let postMedia = async (mediaPath, mediaType) => {
   
  let mediaData = fs.readFileSync(mediaPath, {encoding:'base64'}),
      mediaSize = fs.statSync(mediaPath).size,
      mediaId = ''

      await twitter.initUpload(mediaSize, mediaType) 
        .then(async res => {
          await twitter.appendUpload(res, mediaData).then(async res2 => {
            await twitter.finalizeUpload(res2).then(res3 => {
              mediaId = res3
            })
          })
        }).catch(err => {
          console.log(err)
        })
        console.log('mediaID', mediaId)
        return mediaId
  }


let postTweet = async (status, in_reply_to_status_id = null, media_ids = null)=> {
  let username = '@corongabot'
  console.log('inferno', in_reply_to_status_id)
  return await twitter.makePost('statuses/update', {
    status,
    in_reply_to_status_id,
    username,
    media_ids
  }).then(res => {
    console.log('tweet postado', res.data)
      return res.data.id_str
    })
}
