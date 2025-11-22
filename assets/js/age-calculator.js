// age-calculator.js
function calculateAge(birthday) {
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    // Adjust age if the birth date has not occurred yet this year
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
  
  window.onload = function() {
    const birthDate = '1998-08-10'; // YYYY-MM-DD format
    const age = calculateAge(birthDate);
    document.getElementById('age').textContent = age;
  }
  