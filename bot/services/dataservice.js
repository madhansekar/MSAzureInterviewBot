const axio =require('axios');
const host="http://localhost:8080/INTW/"
class DataService{


    getData  ()  {
        try {
           return axio.get(host+'getData').then((resp)=>{return resp.data.data})
        } catch (error) {
          console.error(error)
        }
      }

      getQuestions(subtopicId,levelId){
        let hostURL=host+'questions/get?'+'subtopicId='+subtopicId+"&levelId="+levelId

        try {
            return axio.get(hostURL).then((resp)=>{return resp.data})
         } catch (error) {
           console.error(error)
         }
      }

      saveUser(user){
        try {
            return axio.put(host+'users/add',user).then((resp)=>{return resp.data})
         } catch (error) {
           console.error(error)
         }
      }

}
module.exports.DataService = DataService;
