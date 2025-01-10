'use client'
 
import ItemDynamicList from './itemDynamicList'
import Button from './button'
import { useState, useEffect, useRef } from 'react'
import { checkIsOnDemandRevalidate } from 'next/dist/server/api-utils';
import { prepareCsvData } from '@/_helpers/utills';
import LabelsetSelector from './labelsetSelector';
import ItemSelector from './itemSelector';
import { CSVLink, CSVDownload } from "react-csv";


const UseAnalyser = ({
    user_id="",
    analyser_id="",
    analyser={},
    results=[],
    sample_ids=[],
    onDatasetChange=()=>{},
    onGetPredictions=()=>{},
    onGetAccuracy=()=>{},
    onConfigChange=()=>{},
    onSampleChange=()=>{},
    OnDownload=()=>{},
    onError=()=>{},
    showPredictions=true,
    model_source
  }) => {

    const [datasets, setDatasets] = useState([{"_id":"","name":"Loading..."}])
    const [chosen_dataset_id, setChosenDatasetID] = useState("0")
    const [labelset, setLabelset] = useState({"_id":"",labels:[]})
    const [showLabels, setShowLabels] = useState(true)
    const [enableLabelling, setEnableLabelling] = useState(false)
    const [labellingSchema, setLabellingSchema] = useState("0")
    const [chosen_labelset_id, setLabelsetId] = useState("")
    const [dataset, setDataset] = useState({"_id":""})
    const [dataset_config, setAnalyserConfig] = useState({})
    const [csvData, setCsvData] = useState([[],[]])
    const csvLink = useRef()
    const [sample, setSample] = useState([])

    const filename = `${analyser_id}_${Date.now()}.csv`

    const getLabelset = (labelset_id) => {

      console.log("getting labelset")
  
      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset?" + new URLSearchParams({
        labelset_id:labelset_id,
        include_labels:true
      }), requestOptions)
      .then(res => res.json()).then((res) => {
        console.log("updated alabelset")
        console.log(res.data)
        setLabelset(res.data)
      })
    }

    const getDataset = (dataset_id) => {

      const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
      };
  
      fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset?" + new URLSearchParams({
        dataset_id:dataset_id,
        include_items:true
      }), requestOptions)
      .then(res => res.json()).then((res) => {
        setDataset(res.data)
      })
    }

    const onConfigChanged = (config) => {
      console.log("new config")
      console.log(config)
      let updated_config = config
      updated_config["dataset_id"] = chosen_dataset_id
      setAnalyserConfig(updated_config)
      // onConfigChange(config)
    }

    const onSampleChanged = (item_ref,analyser_id) => {
      let item_id = item_ref.split('artwork-')[1].split('-')[0]
      let newSample = JSON.parse(JSON.stringify(sample_ids))
      if (sample_ids.includes(item_id)){
        newSample = newSample.filter(id => {
          return id != item_id
        })
      } else {
        newSample.push(item_id)
      }
      setSample(newSample)
    }

    const onButtonOneClick = (                    
      analyser_id, 
      chosen_dataset_id, 
      dataset_artworks, 
      results,
      dataset_config,
      sample_ids
    ) => {
      console.log(dataset_config)
      console.log(dataset_config["auto_select_sample"])
      if (sample_ids.length > 0 || dataset_config["auto_select_sample"]=="true"){
        onGetPredictions(analyser_id, dataset_config, sample_ids)
      } else {
        onError("Please select at least one item for your sample")
      }
    }

    const onButtonTwoClick = (
    ) => {
      csvLink.current.link.click()
    }

    const buttonFunctions = useRef([
      onButtonOneClick,
      onButtonTwoClick
    ])

    const [buttonData, setButtonData] = useState([{
      content: "Generate Labels",
      onbuttonpress: buttonFunctions.current[0],
      disabled: false
    },{
      content: "Download Labelled Data (.csv)",
      onbuttonpress: buttonFunctions.current[1],
      disabled: true
    }
  ])

  const updateButtonData = (data) => {
    let newButtonData = JSON.parse(JSON.stringify(buttonData))
    data.map((button,index) => {
      Object.keys(button).forEach((key) => {
        console.log(newButtonData[index][key])
        newButtonData[index][key] = button[key];
      });
    })
    setButtonData(newButtonData)
  }

  useEffect(() => {

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/datasets?" + new URLSearchParams({
      user_id:user_id,
    }))
    .then(
      response => response.json()
    ).then(
      res => {
        let filtered_datasets = []
        res.data.map((dataset_item)=>{
          if((dataset_item.type == analyser.analyser_format)){
            filtered_datasets.push(dataset_item)
          }
        })
        if (filtered_datasets.length>0){
          setDatasets(filtered_datasets)
        }
      }
    )

  },[])

  useEffect(() => {
    if (chosen_labelset_id!= "" && chosen_labelset_id!= "0"){
      getLabelset(chosen_labelset_id)
    }
    if (chosen_labelset_id === "0") {
      setLabelset({"_id":"",labels:[]})
    }
  }, [chosen_labelset_id])

  useEffect(() => {
    console.log(labelset)
    if (chosen_labelset_id!=""){
      setShowLabels(true)
    }
  },[labelset])

  useEffect(() => {
    if (chosen_dataset_id!="0"){
      getDataset(chosen_dataset_id)
    }
  }, [chosen_dataset_id])

  useEffect(() => {
    onSampleChange(sample)
  }, [sample])

 
  useEffect(() => {
    if (results.length>0 && dataset.artworks){
      prepareCsvData(dataset.artworks, results, labelset.labels, labelset.labelset_type, dataset.type, setCsvData)
      setButtonData([{
        content: "Calculate Predictions",
        onbuttonpress: buttonFunctions.current[0],
        disabled: false
      },{
        content: "Download Predictions (.csv)",
        onbuttonpress: buttonFunctions.current[1],
        disabled: false
      }
    ])      
      console.log(csvData)
    }
  }, [results])


    return (

        <div className="container">
            <br/>
            <h3>Apply analyser to a new dataset</h3>
            <br/>
            {datasets[0]["_id"]!="" ? (
              <>
                <label><span className="label-header">Dataset:</span></label>
                <select name="dataset_id" required onChange={(e) => {
                  setChosenDatasetID(e.target.value)
                  onDatasetChange()
                }} defaultValue={chosen_dataset_id}
                >
                  <option value="0">Select a dataset</option>
                  {datasets.map(function(dataset_item) {
                      let type = dataset_item.type == "textimage" ? "Text & Image" : (dataset_item.type.charAt(0).toUpperCase() + dataset_item.type.slice(1))
                      return(
                        <option key={"dataset-"+dataset_item._id} value={ dataset_item._id }>[{type}] { dataset_item.name }</option>
                      )
                  })}
                </select><br/>
              </>
            ) : (
                <>
                  Please add a dataset to analyse. It must have a matching format (
                    {analyser.analyser_format == "textimage" ? "Text & Image" : (analyser.analyser_format.charAt(0).toUpperCase() + analyser.analyser_format.slice(1))}
                  )
                </>
            )}

            {chosen_dataset_id != "0" && dataset["_id"]!="" ? (
              <LabelsetSelector 
                selector_type={"use-analyser"}
                user_id={user_id}
                analyser_type={analyser.analyser_type}
                dataset_id={dataset["_id"]}
                enableLabelsetCreate={false}
                onLabelsetSelect={(labelset_id) => {
                  setLabelsetId(labelset_id)
                  onDatasetChange()
                }}
                onLabelsetCreate={(labelset_id) => {
                  setEnableLabelling(true)
                  setLabelsetId(labelset_id)
                }}
              />
            ) : <></>}

            <br/>
            <br/>

            {buttonData.map((button, index)=> {
              return (<Button
                key={"button-" + index} 
                content={button.content} 
                onClick={(e) => {
                  button.onbuttonpress(
                    analyser_id,
                    chosen_dataset_id, 
                    dataset.artworks, 
                    results,
                    dataset_config,
                    sample
                  )
                }} 
                disabled={button.disabled}
              />)
            })}
                    
          <CSVLink 
            data={csvData[0]}
            headers={csvData[1]}
            filename={filename}
            className='hidden'
            ref={csvLink}
            target='_blank'
            >Download predictions (.csv)
          </CSVLink>

            <hr />

            {chosen_dataset_id != "0" && dataset["_id"]!="" ? (
              <>
                <div className='item-selector-heading'>
                  <h4>Select items to receive predictions:</h4>
                </div>
                <ItemSelector
                  labelset_id={labelset}
                  dataset={dataset} 
                  labelset={labelset}
                  examples={[]}
                  sample_ids={sample_ids}
                  predictions={results} 
                  enableLabelling={enableLabelling}
                  showPredictions={showPredictions}
                  showLabels={showLabels}
                  selector_type="predictions"
                  sample_type="local"
                  onConfigChanged={onConfigChanged}
                  onSampleChanged={onSampleChanged}
                  expand_mode={"expanded"}
                  useTab={true}
                  model_source={model_source}
                />
              </>
            ) : null}

        <br/>
        <br/>

          </div>);
          
        
}
  
export default UseAnalyser