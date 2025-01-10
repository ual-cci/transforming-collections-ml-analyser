'use client'
 
import { useState, useEffect } from 'react'
import FileUploader from './fileUploader'
 
const DatasetUpload = ({
  onUploadComplete
}) => {
  const [file, setFile] = useState(null)
  const [dataset_name, setDatasetName] = useState("")

  const submitForm = () => {};

  const handleSubmit= (e) => {
    e.preventDefault();

    if (file != null && dataset_name != null && dataset_name != "") {
      const data = new FormData();
      data.append('dataset_name', dataset_name)
      data.append('file', file);
  
      const requestOptions = {
        method: 'POST',
        mode: 'no-cors',
        headers: {'Content-Type': 'application/json'},
        body: data
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset_new", requestOptions)
      .then(() => {
        onUploadComplete()
      })

    }
  }

  return (
    <>
      <h4> Upload a New Dataset </h4>
      <form>
        <label style={{display: "block", marginBottom: "10px"}}>Select a CSV file (The prototype currently requires that the CSV includes a column named 'text')</label>
        <FileUploader
          onFileSelectSuccess={(file) => setFile(file)}
          onFileSelectError={({ error }) => alert(error)}
        />
        <label style={{display: "block", marginBottom: "10px"}}>Dataset name:</label>
        <input type="text" id="dataset_name" name="dataset_name" onChange={e => setDatasetName(e.target.value)} value={dataset_name} required style={{display: "block", marginBottom: "10px"}}/>
        <button type="submit" onClick={handleSubmit}>Upload</button>
      </form>
    </>
  )

}

export default DatasetUpload;