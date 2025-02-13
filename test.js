async function main() {
    const num1 = 5;
    const num2 = 9;
    
    async function addNumbers(num1,num2) {
        return new Promise((resolve) => {
            setTimeout(() => {
                let result = num1 + num2;
                resolve(result);
            }, 5000)
        })
    
    };
    
    let sum = await addNumbers(num1,num2);
    
    console.log(sum);   
}


main();