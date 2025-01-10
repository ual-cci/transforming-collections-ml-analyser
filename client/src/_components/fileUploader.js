import React, {useRef,useState,useEffect} from 'react'
import imageCompression from 'browser-image-compression'
import Papa from 'papaparse'

const FileUploader = ({
    onFileSelectSuccess,
    onFileSelectError,
    onFileCompressStart,
    onFileCompressEnd,
    dataset_type,
    image_upload_type,
    setCsvData
}) => {

    const handleFileInput = async (e) => {

        if (dataset_type === 'text') { 
            const file = e.target.files[0];
            onFileSelectSuccess(file)
        } 
        if (dataset_type === 'image' && image_upload_type === 'image_file') {
            onFileCompressStart()
            const files = Array.from(e.target.files);
            
            //compress images
            for await (const [index, file] of files.entries()) {
                if (file.size > 20000000) {
                    console.log(`${file.name} can't be uploaded (reason: over 20MB).`) //TODO add to errorbox
                    files.splice(index, 1) // remove from files
                } else if (file.size > 500000) {
                    console.log('before compression:', index, file.size)
                    try {
                        files[index] = await imageCompression(file, {maxSizeMB: 0.5})  
                    } catch (error) {
                        console.log(`Compression error: ${file.name} will upload at original size.`)
                        continue
                    }
                    console.log('after compression:', index, files[index].size)
                }
            }
            onFileCompressEnd()    
            onFileSelectSuccess(files)
        }

        if ((dataset_type == 'image' || dataset_type == 'textimage') && image_upload_type == 'image_link') { //only applies to textimage image_link
            const file = e.target.files[0];
            onFileSelectSuccess(file)

            //parse csv to array of images to find out length
            Papa.parse(e.target.files[0], {
                header: true,
                dynamicTyping: true,
                download: true,
                skipEmptyLines: true,
                delimiter: ',',
                complete: async function(results) {
                    let array = results.data
                        .filter((e) => 'image' in e)
                        .map((e) => {return e.image})
                    setCsvData(array)
            }})   
        }
    }

    return (
        <div className="file-uploader">
            {dataset_type === 'text' ? (
                <input type="file" onChange={handleFileInput} accept='.csv' required/>
            ) : (
                <>
                {image_upload_type === 'image_file' ? (
                    <input type="file" onChange={handleFileInput} accept='image/*' multiple required/>
                ) : (
                    <input type="file" onChange={handleFileInput} accept='.csv' required/>
                )}
                </>
            )
            }
        </div>
    )
}

export default FileUploader