import React, {useEffect, useState} from 'react'
import LabelsetSelector from '@/_components/labelsetSelector';
import ItemSelector from '@/_components/itemSelector';
import Accordion from 'react-bootstrap/Accordion';
import StatusBox from '@/_components/statusBox';
import { formatAnalyserType, checkExamples } from '@/_helpers/utills';

const CreateAnalyser = ({
  user,
  analyser_id=null,
  analyser=null,
  editable=true,
  accordionLabels=["Step 1: Details","Step 2: Examples"],
  showPredictions=false,
  getAnalyser=()=>{},
  onComplete=()=>{},
  onUpdate=()=>{},
  onError=()=>{},
  onWarning=()=>{},
  onVersionUpdate=()=>{}
}) =>{

  const [datasets, setDatasets] = useState([{}])
  const [categories, setCategories] = useState([{}])

  const [analyser_name, setAnalyserName] = useState("")
  const [task_description, setTaskDescription] = useState("")
  const [labelling_guide, setLabellingGuide] = useState("")

  const [chosen_dataset_id, setChosenDatasetID] = useState("")
  const [chosen_category_id, setChosenCategoryID] = useState("")
  const [chosen_labelset_id, setChosenLabelsetID] = useState("")
  const [chosen_analyser_type, setChosenAnalyserType] = useState("binary")
  const [chosen_version, setChosenVersion] = useState("")

  const [new_analyser_labelset_name, setNewAnalyserLabelsetName] = useState("")

  const [labelset, setLabelset] = useState({
    "_id":"",
    labels:[]
  })
  const [dataset, setDataset] = useState({
    "_id":"",
    "artworks":[],
    "type":""
  })
  const [examples, setExamples] = useState([])
  const [accuracy, setAccuracy] = useState("")

  const [editMode,setEditMode] = useState(true)
  const [enableExampleSelection,setEnableExampleSelection] = useState(true)

  const [analyser_config, setAnalyserConfig] = useState({})

  useEffect(() => {
    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/datasets?"+ new URLSearchParams({
      user_id:user.sub
    }))
    .then(
      response => response.json()
    ).then(
      res => {
        setDatasets(res.data)
      }
    )
    
    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/categories?"+ new URLSearchParams({
      user_id:user.sub
    }))
    .then(
      response => response.json()
    ).then(
      res => {
        setCategories(res.data)
      }
    )
  },[])

  const getLabelset = (labelset_id) => {

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
      if(res.status == 200){
        setLabelset(res.data)
        if ('labelling_guide' in res.data && res.data['labelling_guide']!=undefined && labelling_guide==""){
          setLabellingGuide(res.data['labelling_guide'])
        }
      } else {
        onError("Labelset failed to load")
      }
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
      if (res.status == 200){
        setDataset(res.data)
      } else {
        onError("Dataset failed to load")
      }
    })
  }

  const updateAnalyser = () => {
    console.log("update analyser")
    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'},
    };

    let update_data = {}

    if (Object.keys(analyser).length!=0){
      if (analyser_name!=analyser.name) update_data['name'] = analyser_name
      if (chosen_analyser_type!=analyser.analyser_type) update_data['analyser_type'] = chosen_analyser_type
      if (task_description!=analyser.task_description) update_data['task_description'] = task_description
      if (labelling_guide!=analyser.labelling_guide) update_data['labelling_guide'] = labelling_guide
      if (chosen_dataset_id!=analyser.dataset_id) update_data['dataset_id'] = chosen_dataset_id
      if (chosen_category_id!=analyser.category_id) update_data['category_id'] = chosen_category_id
      if (chosen_labelset_id.length>0) update_data['labelset_id'] = chosen_labelset_id
      if (examples!=analyser.example_refs) update_data['example_refs'] = examples
      if ((dataset['type'].length>0) && (dataset['type']!=analyser.analyser_format)) update_data['analyser_format'] = dataset['type']

    }

    fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/analyser_update?"+ new URLSearchParams({
      analyser_id:analyser_id,
      update_data:JSON.stringify(update_data),
      analyser_config:JSON.stringify(analyser_config)
    }), requestOptions)
    .then(response => response.json())
    .then(res => {
      console.log(res)
      if(res.status=="500"){
        console.log(res['error'])
        onError(res['error'])
      } else {
        onUpdate()
      }
    })
  }

  const handleSave = async (e) => {
    console.log("handling save")
    e.preventDefault()
    if (chosen_dataset_id==="") {
      onError('Please select a dataset.')
    } 
    else if (chosen_labelset_id==="") {
      onError('Please select a labelset.')
    } 
    else {
      let labelset_id
      if (chosen_labelset_id != "0" && chosen_labelset_id != "-1") {
        labelset_id = await handleLabelsetCopy()
      } else {
        labelset_id = await handleLabelsetSubmit()
      }
      console.log(labelset_id)

      if (Object.keys(analyser).length!=0){
        updateAnalyser()
      } else {
        setEditMode(false)
        let data = {
          "analyser_name":analyser_name,
          "task_description":task_description,
          "labelling_guide":labelling_guide,
          "chosen_dataset_id":chosen_dataset_id,
          "chosen_category_id":chosen_category_id,
          "chosen_labelset_id":labelset_id,
          "chosen_analyser_type":chosen_analyser_type,
          "chosen_version":chosen_version,
          "example_ids":examples
        }
        onComplete(analyser_config, data)
      }
    }
  }

  const onExamplesChanged = (item_ref,analyser_id) => {
    let item_id = item_ref.split('artwork-')[1].split('-')[0]
      let newExamples = examples
      if (examples.includes(item_id)){
        newExamples = newExamples.filter(id => id != item_id)
      } else {
        newExamples.push(item_id)
      }
      setExamples(newExamples)
  }

  const onConfigChanged = (config) => {
    setAnalyserConfig(config)
  }

  const onLabelsChanged = () => {
    if ('labelset_id' in analyser && analyser['labelset_id'].length > 0){
      getLabelset(analyser.labelset_id)
    } else {
      getLabelset(chosen_labelset_id)
    }
  }

  const createLabelset = async (name) => {
    console.log(chosen_dataset_id)
    console.log('creating labelset')
    let labelset_id

    const requestOptions = {
        method: 'GET',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'}
    };

    await fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset_new?" + new URLSearchParams({
        owner_id: user.sub,
        name:name,
        type:chosen_analyser_type, 
        dataset_id: chosen_dataset_id
    }), requestOptions)
    .then(res => res.json()).then((res) => {
        labelset_id = res.data
        console.log(labelset_id)
        setChosenLabelsetID(labelset_id)
    })

    return labelset_id
  }

  const handleLabelsetSubmit = async () => {
    if (new_analyser_labelset_name.length>0){
        let labelset_id = await createLabelset(new_analyser_labelset_name)
        console.log(labelset_id)
        return labelset_id
    } else {
        if (analyser_name.length>0) {
            let name = '"' +  analyser_name + '" Analyser – Labels'
            setNewAnalyserLabelsetName(name)
            let labelset_id = await createLabelset(name)
            return labelset_id
        }
    }
  }

  const handleLabelsetCopy = async () => {
    if (new_analyser_labelset_name.length>0){
        let labelset_id = await copyLabelset(new_analyser_labelset_name)
        console.log(labelset_id)
        return labelset_id
    } else {
      if (analyser_name.length>0){
          let name = '"' +  analyser_name + '" Analyser – Labels'
          setNewAnalyserLabelsetName(name)
          let labelset_id = await copyLabelset(name)
          return labelset_id
      }
    }
  }

  const copyLabelset = async (name) => {
    let labelset_id

    const requestOptions = {
      method: 'GET',
      mode: 'cors',
      headers: {'Content-Type': 'application/json'}
    };

    await fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/labelset_copy?" + new URLSearchParams({
      labelset_id:chosen_labelset_id,
      owner_id: user.sub,
      name:name
    }), requestOptions)
    .then(res => res.json()).then((res) => {
        labelset_id = res.data
        setChosenLabelsetID(labelset_id)
    })

    return labelset_id
  } 

  useEffect(() => {
    if (chosen_labelset_id!= "" && chosen_labelset_id != "0" && chosen_labelset_id != "-1"){
      getLabelset(chosen_labelset_id)
    } else {
      setLabelset({
        "_id":"",
        labels:[]
      })
    }
  }, [chosen_labelset_id])

  useEffect(() => {
    console.log(chosen_dataset_id)
    if (chosen_dataset_id!= ""){
      getDataset(chosen_dataset_id)
    } else {
      setDataset({})
    }
  }, [chosen_dataset_id])

  useEffect(() => {
    if (new_analyser_labelset_name!= ""){
      console.log(new_analyser_labelset_name)
    }
  }, [new_analyser_labelset_name])

  useEffect(() => {
    if (analyser!=null && Object.keys(analyser).length!=0){
      console.log(analyser.dataset_id)
      setAnalyserName(analyser.name)
      setTaskDescription(analyser.task_description)
      setLabellingGuide(analyser.labelling_guide)
      setChosenCategoryID(analyser.category_id)
      setChosenAnalyserType(analyser.analyser_type)
      setChosenDatasetID(analyser.dataset_id)
      setChosenLabelsetID(analyser.labelset_id)
      setExamples(analyser.example_refs)
      setChosenVersion(analyser.version)
      if (analyser.dataset_id.length>0){
        getDataset(analyser.dataset_id)
        setEditMode(false)
      } else {
        setEditMode(true)
      }
      if (analyser.labelset_id.length>0){
        getLabelset(analyser.labelset_id)
        setEditMode(false)
      } else {
        setEditMode(true)
      }
    } else {
      setAnalyserName("")
      setTaskDescription("")
      setLabellingGuide("")
      setChosenCategoryID("")
      setChosenAnalyserType("binary")
      setChosenDatasetID("")
      setChosenLabelsetID("")
      setExamples([])
      setChosenVersion("")
      setDataset({
        "_id":"",
        "artworks":[]
      })
      setLabelset({
        "_id":"",
        labels:[]
      })
      setEditMode(true)
    }

  }, [analyser])


  return (
    <main>
    <form onSubmit={handleSave}>
    <Accordion defaultActiveKey={["0","1"]} alwaysOpen>
      <Accordion.Item eventKey="0">
        <Accordion.Header>{accordionLabels[0]}</Accordion.Header>
        <Accordion.Body>
          {editMode ? (
            <>
            <label>Name:</label>
            <input type="text" name="name" required onChange={e => setAnalyserName(e.target.value)} defaultValue={Object.keys(analyser).length!=0 ? analyser.name : ""} placeholder="New analyser name"/>
            <br/>
            </>
          ) : (
            <>
            </>
          )}

          <label><h4>Analyser Details:</h4></label><br/>

          {editMode ? (
            <>
              <label><span className="label-header">Task Description:</span></label>
              <span className="material-symbols-outlined robot-icon">smart_toy</span>
              <br/>
              <textarea className="wide_input" type="text" name="description" required onChange={e => setTaskDescription(e.target.value)} 
                defaultValue={Object.keys(analyser).length!=0 ? analyser.task_description : ""}
                placeholder='eg. "Analyse descriptions of artworks to see if they include derogatory terms. If the artwork includes a term, flag as "True" and if it does not, flag as "False""'
              />
              <br/>
            </>
          ) : (
            <>
              {(analyser!=null && Object.keys(analyser).length!=0 && analyser.task_description != "") ? ( 
                <p><span className="label-header">Task Description:</span> <i>"{analyser.task_description}"</i></p>
              ):(
                <>
                {task_description!="" ? (
                  <p><span className="label-header">Task Description:</span> <i>{task_description}</i></p>
                ) : (
                  <p><span className="label-header">Task Description:</span> <i>None</i></p>
                )}
                </>
              )}
            </>
          )}

          {/* {editMode ? (
            <>
            <label><span className="label-header">Category (Optional):</span></label>
            <select name="category_id" onChange={e => setChosenCategoryID(e.target.value)} defaultValue={Object.keys(analyser).length!=0 ? analyser.category_id : ""}>
              <option value="">Select a category</option>
              {categories.map(function(category) {
                return(
                  <option key={"category-"+category._id} value={ category._id }>{ category.name }</option>
                )
              })}
            </select>
            <br/>
            </>
          ) : (
            <>
            {analyser.category_id=="" ? ( 
              <p><span className="label-header">Category:</span> <i>None</i></p>
            ):(
              <p><span className="label-header">Category:</span> {analyser.category_name}</p>
            )}
            </>
          )} */}

        </Accordion.Body>
      </Accordion.Item>
      <Accordion.Item eventKey="1">
        <Accordion.Header>{accordionLabels[1]}</Accordion.Header>
        <Accordion.Body>
        <label><h4>Labelling Details:</h4></label><br/>
          {editMode ? (
            <>
            <label><span className="label-header">Label Type:</span></label>
            <span className="material-symbols-outlined robot-icon">smart_toy</span>
            <select name="analyser_type" required onChange={e => setChosenAnalyserType(e.target.value)} 
              value={chosen_analyser_type}>
              <option value="binary">{formatAnalyserType("binary")}</option>
              <option value="score">{formatAnalyserType("score")}</option>
            </select>
            <br/>
            </>
          ) : (
            <p><span className="label-header">Label Type:</span> {formatAnalyserType(analyser.analyser_type)}</p>
          )}
          {editMode ? (
            <>
            <label><span className="label-header">Labelling Guide (Optional):</span></label>
            <span className="material-symbols-outlined robot-icon">smart_toy</span>
            <br/>
            <textarea className="wide_input" type="text" name="labelling_guide" onChange={e => setLabellingGuide(e.target.value)} 
              defaultValue={Object.keys(analyser).length!=0 ? analyser.labelling_guide : labelling_guide}
              placeholder='eg. "Here is as list of key derogatory terms and phrase types that you should look for...."'
            />
            <br/>
            </>
          ) : (
            <>
              {(Object.keys(analyser).length!=0 && analyser.labelling_guide != "") ? ( 
                <p><span className="label-header">Labelling Guide:</span> <i>"{analyser.labelling_guide}"</i></p>
              ):(
                <>
                {labelling_guide!="" ? (
                  <p><span className="label-header">Labelling Guide:</span> <i>{labelling_guide}</i></p>
                ) : (
                  <p><span className="label-header">Labelling Guide:</span> <i>None</i></p>
                )}
                </>
              )}
            </>
          )}

          {editMode ? (
            <>
            <label><span className="label-header">Dataset:</span></label>
            <select name="dataset_id" onChange={e => setChosenDatasetID(e.target.value)} value={chosen_dataset_id}>
              <option value="">Select a dataset</option>
              {datasets.map(function(dataset) {
                if (Object.keys(dataset).length !== 0) {
                  let type = dataset.type == "textimage" ? "Text & Image" : (dataset.type.charAt(0).toUpperCase() + dataset.type.slice(1))
                  return(
                    <option key={"dataset-"+dataset._id} value={ dataset._id }>[{type}] { dataset.name }</option>
                  )
                }
              })}
            </select>
            <br/>
            </>
          ) : (
            <p><span className="label-header">Dataset:</span> {analyser.dataset_name}</p>
          )}
          {editMode ? (
            <>
            {(dataset['_id'] != "") ? (
              <>
              <LabelsetSelector 
              selector_type={'viewanalyser'}
              user_id={user.sub} 
              dataset_id={chosen_dataset_id} 
              analyser_type={chosen_analyser_type} 
              analyser_name={analyser_name}
              enableLabelsetCreate={true} 
              enableLabelsetCopy={true}
              onLabelsetSelect={()=>{}}
              onLabelsetCreate={(labelset_id)=>{setChosenLabelsetID(labelset_id)}} 
              defaultValue={Object.keys(analyser).length!=0 ? analyser.labelset_id : ""}
              setNewAnalyserLabelsetName={setNewAnalyserLabelsetName}
              setChosenLabelsetID={setChosenLabelsetID}
              />
              <br/>
              <br/>
              </>
            ) : <></>}
            </>
          ) : (
            <>
            {(analyser.labelset_id != "") ? (
              <p><span className="label-header">Labelset:</span> {analyser.labelset_name}</p>
            ) : (
              <></>
            )}
            </>
          )}

        <hr></hr>     
        {(dataset!=undefined && Object.keys(dataset).length!=0) ? (
            <>
            {editMode ? (
              <div className="item-selector-heading">
                <label><h4>Preview Dataset</h4></label>
                <br/>
                <p> Please provide 5-20 labelled examples for training</p>
              </div>
            ) : (
              <>
                <div className="item-selector-heading">
                  <h4>Preview Dataset</h4>
                </div>
              </>
            )}
              <ItemSelector
                analyser_id={analyser_id}
                labelset_id={chosen_labelset_id}
                labelset_type={chosen_analyser_type}
                dataset={dataset}
                labelset={labelset}
                examples={examples}
                sample_ids={null}
                predictions={null}
                showPredictions={showPredictions && predictions.length > 0 ? true : false}
                showExamples={!editMode}
                showSample={!editMode}
                showLabels={true}
                enableExampleSelection={false}
                enableLabelling={false}
                onLabelsChanged={onLabelsChanged}
                onConfigChanged={onConfigChanged}
                onExamplesChanged={onExamplesChanged}
                selector_type="examples"
                />
            </>
          ) : <></>}
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
            
      {editMode ? (
        <>
        <br/>
        <br/>
          <button type="submit">Save Analyser</button>
        <br/>
        </>
      ):(<></>)}

      <br/>
      </form>
      </main>
  )
}

export default CreateAnalyser;