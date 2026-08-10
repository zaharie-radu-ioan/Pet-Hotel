/* =====================================================
   ELEMENTS
===================================================== */

const form =
  document.getElementById("signupForm");

const successMessage =
  document.getElementById("successMessage");

const loginLink =
  document.getElementById("loginLink");


/* =====================================================
   ERROR HANDLING
===================================================== */

function setError(input, message) {

  const field =
    input.closest(".field");

  const error =
    document.querySelector(
      `[data-error-for="${input.id}"]`
    );


  field.classList.toggle(
    "has-error",
    Boolean(message)
  );


  error.textContent =
    message || "";
}


/* =====================================================
   FORM VALIDATION
===================================================== */

function validateForm() {

  let valid = true;


  const email =
    document.getElementById("email");

  const firstName =
    document.getElementById("firstName");

  const lastName =
    document.getElementById("lastName");

  const password =
    document.getElementById("password");

  const confirmPassword =
    document.getElementById("confirmPassword");


  /* -----------------------------------------
     Clear previous errors
  ----------------------------------------- */

  [
    email,
    firstName,
    lastName,
    password,
    confirmPassword
  ].forEach(input => {

    setError(input, "");

  });


  /* -----------------------------------------
     EMAIL
  ----------------------------------------- */

  if (!email.value.trim()) {

    setError(
      email,
      "Email is required."
    );

    valid = false;

  } else if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/
      .test(email.value.trim())
  ) {

    setError(
      email,
      "Please enter a valid email."
    );

    valid = false;

  }


  /* -----------------------------------------
     FIRST NAME
  ----------------------------------------- */

  if (!firstName.value.trim()) {

    setError(
      firstName,
      "First name is required."
    );

    valid = false;

  }


  /* -----------------------------------------
     LAST NAME
  ----------------------------------------- */

  if (!lastName.value.trim()) {

    setError(
      lastName,
      "Last name is required."
    );

    valid = false;

  }


  /* -----------------------------------------
     PASSWORD
  ----------------------------------------- */

  if (password.value.length < 8) {

    setError(
      password,
      "Password must contain at least 8 characters."
    );

    valid = false;

  }


  /* -----------------------------------------
     CONFIRM PASSWORD
  ----------------------------------------- */

  if (!confirmPassword.value) {

    setError(
      confirmPassword,
      "Please confirm your password."
    );

    valid = false;

  } else if (
    password.value !==
    confirmPassword.value
  ) {

    setError(
      confirmPassword,
      "Passwords do not match."
    );

    valid = false;

  }


  return valid;
}


/* =====================================================
   FORM SUBMIT
===================================================== */

form.addEventListener(
  "submit",
  event => {

    /*
      Prevent browser from
      refreshing the page.
    */

    event.preventDefault();


    /*
      Clear previous
      success message.
    */

    successMessage.textContent = "";


    /*
      Validate form.
    */

    if (!validateForm()) {

      /*
        Focus the first
        invalid field.
      */

      const firstInvalid =
        form.querySelector(
          ".has-error input"
        );


      if (firstInvalid) {
        firstInvalid.focus();
      }


      return;
    }


    /*
      Form is valid.
    */

    successMessage.textContent =
      "Registration form is valid.";


    /*
      =================================================
      BACKEND INTEGRATION
      =================================================

      Când vei avea backend-ul,
      poți înlocui partea de mai sus cu:

      const formData =
        new FormData(form);

      fetch("/api/register", {
        method: "POST",
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        console.log(data);
      })
      .catch(error => {
        console.error(error);
      });

    */

  }
);


/* =====================================================
   SHOW / HIDE PASSWORD
===================================================== */

document
  .querySelectorAll(".password-toggle")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        /*
          Find the input connected
          to this button.
        */

        const input =
          document.getElementById(
            button.dataset.target
          );


        /*
          Check current type.
        */

        const isPassword =
          input.type === "password";


        /*
          Toggle input type.
        */

        input.type =
          isPassword
            ? "text"
            : "password";


        /*
          Change icon.
        */

        button.textContent =
          isPassword
            ? "◌"
            : "◉";


        /*
          Update accessibility label.
        */

        button.setAttribute(
          "aria-label",
          isPassword
            ? "Hide password"
            : "Show password"
        );

      }

    );

  });


/* =====================================================
   CLEAR ERRORS WHILE TYPING
===================================================== */

form
  .querySelectorAll("input")
  .forEach(input => {

    input.addEventListener(
      "input",
      () => {

        /*
          Remove error from
          current field.
        */

        setError(
          input,
          ""
        );


        /*
          Remove success message
          when user edits the form.
        */

        successMessage.textContent =
          "";

      }
    );

  });


/* =====================================================
   LOGIN LINK
===================================================== */

loginLink.addEventListener(
  "click",
  event => {

    event.preventDefault();


    /*
      Momentan este doar un placeholder.

      Când creezi pagina de login,
      poți folosi:

      window.location.href = "login.html";

      sau:

      window.location.href = "/login";
    */


    alert(
      "Connect this link to your login page."
    );

  }
);