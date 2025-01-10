'use client'
 
import Head from 'next/head'
import React, {useEffect, useState} from 'react'
import Link from 'next/link'
import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0/client";
import { useRouter } from 'next/navigation'
import FileUploader from '../_components/fileUploader'
import StatusBox from '@/_components/statusBox'
import Papa from 'papaparse'
 
const DatasetUpload = ({user, error, isLoading}) => {
  const title = "UAL TaNC App - Upload Dataset"

  const [model_source, setModelSource] = useState("")
  const [text_file, setTextFile] = useState(null)
  const [image_files, setImageFiles] = useState(null)
  const [text_image_file, setTextImageFile] = useState(null)

  const [dataset_name, setDatasetName] = useState("")
  const [dataset_type, setDatasetType] = useState("text")
  const [image_upload_type, setImageType] = useState("image_file")
  const [csvData, setCsvData] = useState([])

  const [uploadStatus, setUploadStatus] = useState("")
  const router = useRouter()

  const onRadioChange = (e) => {
    setDatasetType(e.target.value)
  }

  const onImageRadioChange = (e) => {
    setImageType(e.target.value)
  }

  const getModelSource = () => {
    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'}
    };

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/model_source?" + new URLSearchParams({
    }), requestOptions)
    .then(
      response =>  response.json()
    ).then(
      res => {
        console.log(res)
        if (res.status == 200)
          setModelSource(res.data)
      }
    )
  }
 
  const handleSubmit= (e) => {
    e.preventDefault();

    if (dataset_name != null && dataset_name != "") {
      const data = new FormData()
      data.append('dataset_name', dataset_name)

      if (dataset_type.includes('text') && text_file != null) {
        setUploadStatus("Uploading data...")
        data.append('text_file', text_file);
      }

      if (dataset_type.includes('image') && image_files != null) {

        if (image_upload_type === 'image_file') {
          if(image_files.length>1000){
            setUploadStatus("Uploading data (This may take 5-10 minutes for 1000+ images) ...") 
          } else {
            setUploadStatus("Uploading data...")
          }
          for (let f in image_files) {
            data.append('image_file', image_files[f])
          }
        } else {
          if(csvData.length>1000){
            setUploadStatus("Uploading data (This may take 5-10 minutes for 1000+ images) ...") 
          } else {
            setUploadStatus("Uploading data...")
          }
          data.append('image_file', image_files)
        }
      }

      if (dataset_type === 'textimage' && text_image_file != null && image_upload_type === 'image_link') {
        if(csvData.length>1000){
          setUploadStatus("Uploading data (This may take 5-10 minutes for 1000+ images) ...") 
        } else {
          setUploadStatus("Uploading data...")
        }
        data.append('text_image_file', text_image_file)
      }

      const requestOptions = {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'application/json'},
        body: data
      };
      
      if (dataset_type === 'text') {
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset_new?" + new URLSearchParams({
          owner_id:user.sub,
          dataset_type:dataset_type
        }),requestOptions)
        .then(() => {
          setUploadStatus("Uploading complete!")
          router.push("/")
        })
      } else {
        fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset_new?" + new URLSearchParams({
          owner_id:user.sub,
          dataset_type:dataset_type,
          image_upload_type:image_upload_type
        }),requestOptions)
        .then(() => {
          setUploadStatus("Uploading complete!")
          router.push("/")
        })
      }
    }
  }
  

  useEffect(() => {
    console.log("new upload status")
    console.log(uploadStatus)
  },[uploadStatus])

  useEffect(() => {

  },[csvData])

  return (
    <>
    <Head>
        <title>{title}</title>
    </Head>
    <main>
      <div className='container'>
        <h1> Create a new Dataset </h1>
        <hr/>
        <form onSubmit={handleSubmit}>
          <label><h4>Dataset type</h4></label><br/>
          <input type="radio" id="text" name="dataset_type" value="text" checked={dataset_type === 'text'} onChange={onRadioChange}/>
          <label htmlFor="text">Text</label><br/>
          <input type="radio" id="image" name="dataset_type" value="image" checked={dataset_type === 'image'} onChange={onRadioChange}/>
          <label htmlFor="image">Image</label><br/>
          <input type="radio" id="textimage" name="dataset_type" value="textimage" checked={dataset_type === 'textimage'} onChange={onRadioChange}/>
          <label htmlFor="textimage">Text and Image</label> 
          <hr/>
          <label><h4>Dataset name:</h4></label>
          <input type="text" id="dataset_name" name="dataset_name" onChange={e => setDatasetName(e.target.value)} value={dataset_name} required style={{display: "block", marginBottom: "10px"}}/>

          {dataset_type == "textimage" ? (
            <>
              {image_upload_type === 'image_file' ? (
                <label><h4>Upload Images</h4></label>
                ) : (
                <label><h4>Upload Text and Images</h4></label>
                )
              }
              <br/>
              <input type="radio" id="image_file" name="image_upload_type" value="image_file" checked={image_upload_type === 'image_file'} onChange={onImageRadioChange}/>
              <label htmlFor="image_file">Image files (select at least one image, max. 20MB per image)</label><br/>
              <input type="radio" id="image_link" name="image_upload_type" value="image_link" checked={image_upload_type === 'image_link'} onChange={onImageRadioChange}/>
              <label htmlFor="image_link">Image links (select a CSV file containing image links and text)</label><br/>
              {image_upload_type === 'image_file' ? (
                  <FileUploader
                    onFileSelectSuccess={(file) => setImageFiles(file)}
                    onFileSelectError={({ error }) => alert(error)}
                    onFileCompressStart={() => setUploadStatus('Compressing images...')}
                    onFileCompressEnd={() => setUploadStatus('Compression finished! Ready to create dataset.')}
                    dataset_type={'image'} 
                    image_upload_type={image_upload_type}
                    setCsvData={setCsvData}
                  />
                ) : (
                  <>
                  <div className="feature-box">
                  <span className='material-symbols-outlined'>warning</span>
                  <span><b>Note: Please ensure that the CSV is formatted correctly</b></span><br/>
                  <ul>
                    <li>Please ensure that the CSV includes a column named 'text' with the text data and a column named 'image' with the corresponding image URLs</li>
                    <li>Optional: You can include a column called 'object_id' containing object or reference IDs</li>
                    {model_source === 'huggingface' ? (
                        <li>Note: You are using the local model option. Please limit each piece of text to 200 characters to avoid memory issues.</li> 
                      ) : (
                        <></>
                      )
                    }
                  </ul>
                 </div>
                 <br/>
                 <br/>
                  <FileUploader
                    onFileSelectSuccess={(file) => setTextImageFile(file)}
                    onFileSelectError={({ error }) => alert(error)}
                    onFileCompressStart={() => setUploadStatus('Compressing images...')}
                    onFileCompressEnd={() => setUploadStatus('Compression finished! Ready to create dataset.')}
                    dataset_type={'textimage'} 
                    image_upload_type={image_upload_type}
                    setCsvData={setCsvData}
                  />
                  </>
                )
              }
              <br/>
              {image_upload_type === 'image_file' ? (
                <>
                <label><h4>Upload Text: Select a CSV file</h4></label><br/>
                <div className="feature-box">
                  <span className='material-symbols-outlined'>warning</span>
                  <span><b>Note: Please ensure that the CSV is formatted correctly</b></span><br/>
                  <ul>
                    <li>Please ensure that the CSV includes a column named 'text' with the text data</li>
                    <li>It is also reccomended to include a column named 'filename' containing the file names of the images (excl. file extensions) which match with each piece of text</li>
                    <li>If a 'filename' column is not provided, the text-image pairs will be displayed in the order of the images uploaded</li>
                    <li>Each image can only be assigned to one piece of text. Duplicate the image file and use different file names if you wish to use multiple texts for one image.</li>
                    <li>Optional: You can include a column called 'object_id' containing object or reference IDs</li>
                    {model_source === 'huggingface' ? (
                        <li>Note: You are using the local model option. Please limit each piece of text to 200 characters to avoid memory issues.</li> 
                      ) : (
                        <></>
                      )
                    }
                  </ul>
                </div>
                <br/>
                <br/>
                <FileUploader
                onFileSelectSuccess={(file) => setTextFile(file)}
                onFileSelectError={({ error }) => alert(error)}
                dataset_type={"text"}
                />
                </>
              ) : (<></>)
              } 
            </>
          ) : (
            <>
            {dataset_type == 'text' ? (
              <>
                <label><h4>Upload Text: Select a CSV file</h4></label><br/>
                <div className="feature-box">
                  <span className='material-symbols-outlined'>warning</span>
                  <span><b>Note: Please ensure that the CSV is formatted correctly</b></span><br/>
                  <ul>
                    <li>Please ensure that the CSV includes a column named 'text' with the text data</li>
                    <li>Optional: You can include a column called 'object_id' containing object or reference IDs</li>
                    {model_source === 'huggingface' ? (
                        <li>Note: You are using the local model option. Please limit each piece of text to 200 characters to avoid memory issues.</li> 
                      ) : (
                        <></>
                      )
                    }
                  </ul>
                </div>
                <br/>
                <br/>
                <FileUploader
                  onFileSelectSuccess={(file) => setTextFile(file)}
                  onFileSelectError={({ error }) => alert(error)}
                  dataset_type={dataset_type}
                />
              </>
            ) : (<></>)} 
            {dataset_type == 'image' ? (
              <>
              <label><h4>Upload Images</h4></label>
              <br/>
              <input type="radio" id="image_file" name="image_upload_type" value="image_file" checked={image_upload_type === 'image_file'} onChange={onImageRadioChange}/>
              <label htmlFor="image_file">Image files (select at least one image, max. 20MB per image)</label><br/>
              <input type="radio" id="image_link" name="image_upload_type" value="image_link" checked={image_upload_type === 'image_link'} onChange={onImageRadioChange}/>
              <label htmlFor="image_link">Image links (select a CSV file containing image links)</label><br/>
              {image_upload_type == 'image_link' ? (
                <>
                <div className="feature-box">
                  <span className='material-symbols-outlined'>warning</span>
                  <span><b>Note: Please ensure that the CSV is formatted correctly</b></span><br/>
                  <ul>
                    <li>Please ensure that the CSV includes a column named 'image' with the image URLs</li>
                    <li>Optional: You can include a column called 'object_id' containing object or reference IDs</li>
                  </ul>
                </div>
                <br/>
                <br/>
                </>
              ) : (<></>) }
              <FileUploader
                onFileSelectSuccess={(file) => setImageFiles(file)}
                onFileSelectError={({ error }) => alert(error)}
                onFileCompressStart={() => setUploadStatus('Compressing images...')}
                onFileCompressEnd={() => setUploadStatus('Compression finished! Ready to create dataset.')}
                dataset_type={dataset_type}
                image_upload_type={image_upload_type}
                setCsvData={setCsvData}
              />
              </>
            ) : (<></>)} 
            </>
          )}
          <hr/>
          <br/>
          {uploadStatus !== 'Compressing images...' ? (
            <input type="submit" value="Create Dataset"/>
          ): (
            <input type="submit" value="Create Dataset" disabled/>
          )}
        </form>
        <StatusBox text={uploadStatus} />
      </div>
    </main>
    </>
  )

}

export default withPageAuthRequired(DatasetUpload);