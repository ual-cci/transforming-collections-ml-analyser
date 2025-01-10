'use client'
 
import { useState, useEffect } from 'react'
import LoaderButton from './loaderButton'
import Link from 'next/link'
import { dateFromObjectId } from '@/_helpers/utills'
import ButtonModal from './buttonModal'
 
const DatasetList = ({
  user_id,
  datasets=[{id:"",name:"",status:""}], 
  onDeleteHandler=()=>{}
}) => {

  const [datasetStatuses, setDatasetStatuses] = useState([{_id:"",status:""}])

  const getDatasetStatus = async (datasetID) => {
    if (datasetID != "Loading..."){
      let response = await fetch((process.env.NEXT_PUBLIC_SERVER_URL || "") + "/backend/dataset_status?" + new URLSearchParams({
        dataset_id:datasetID
      }))
      let data = await response.json()
      return data

    } else {
      return {id:datasetID, status:"Loading..."}
    }
  }

  const updateStatuses = async(datasets) => {
    console.log(datasets)
    if (datasets.length > 0 && datasets[0]._id !== undefined && datasets[0]._id !== 'Loading...'){
      let statuses = []
      let promises = datasets.map(async (dataset)=> {
          return await getDatasetStatus(dataset._id)
      })

      for await (let res of promises){
        if (res.data){
          statuses.push({id:res.data.id, status:res.data.status})
        }
      }

      setDatasetStatuses(statuses)
    }
  }
  useEffect(() => {
    updateStatuses(datasets)
    datasets.sort(function(a,b){
      let a_date = 'last_updated' in a ? new Date(a['last_updated']) : (("_id" in a) ? dateFromObjectId(a._id) : "")
      let b_date = 'last_updated' in b ? new Date(b['last_updated']) : (("_id" in b) ? dateFromObjectId(b._id) : "")
      return b_date - a_date;
    });  
  },[datasets])

  return (
    <table id="datasets" className="table table-striped">
    <thead>
      <tr>
        <th>Name</th>
        <th>Item Count</th>
        <th>Status</th>
        <th>Availability</th>
        <th></th>
      </tr>
    </thead>
    <tbody>
    {datasets.map(function(dataset,index) {
      return (
        (dataset.status!=-1) ? 
        (
          <tr key={"dataset-" + (dataset._id != undefined ? dataset._id : index)} >
            <td>
              {(dataset._id != undefined) ? (
                <Link href={"/viewdataset?dataset_id=" + dataset._id}>{ dataset.name } </Link>
              ) : <></>}
            </td>
            <td> 
              {(dataset._id != undefined) ? (
                dataset['artwork_count']
              ) : ""}
            </td>
            <td> 
              { (dataset.status==1) ? "Ready" : (
                  (dataset.status==0) ? "Processing" : (
                    (dataset.status==-1) ? "Deleting" : (
                      "Loading..."
                    )
                  )
                )
              }
            </td>
            <td>
            { ('owner' in dataset && dataset.owner == user_id) && 
            (!('users' in dataset) || ('users' in dataset && dataset.users.length == 0)) ? (
              "Private"
            ) : ((('users' in dataset) && (dataset.users.length > 0)) ? ("Shared") : ("Public"))
            }
            </td>
            <td>
            { 'owner' in dataset && dataset.owner == user_id ? (
              <ButtonModal 
                onPressHandler={onDeleteHandler} 
                id={dataset._id} 
                title={"Delete Dataset"}
                iconName="delete"
                warningText="Note:Any associated labelsets will also be removed"
                buttonActionText="Delete"
              >
                {"Are you sure you want to permanently delete" + (dataset.name.length>0 ? (" dataset '" + dataset.name + "' ") : " this dataset") + "?"}
              </ButtonModal>
            ) : (
              <></>
            )}
            </td>
          </tr>
        ) : (<></>)
      )
    })}
      <tr>
        
      </tr>
    </tbody>
    </table>
  );
}

export default DatasetList;