// // axios
// //   .get("https://swapi.dev/api/people/1/")
// //   .then((res) => {
// //     console.log("RESPONSE: ", res);
// //   })
// //   .catch((e) => {
// //     console.log("ERROR! ", e);
// //   });

// const getStarWarsPerson = async (id) => {
//   try {
//     const res = await axios.get(`https://swapi.dev/api/people/${id}/`);
//     console.log(res.data);
//   } catch (e) {
//     console.log("ERROR", e);
//   }
// };

// getStarWarsPerson(5);
// getStarWarsPerson(10);




// axios.get("https://swapi.dev/api/people/4")
//     .then(res => console.log(res))
//     .catch(e => console.log(e))

const getSWPeople = async (id) => {
    try {
        const res = await axios.get("https://swapi.dev/api/people/" + id)
        console.log(res.data)
    } catch(e) {
        console.log(e)
    }
    
}

getSWPeople(prompt())