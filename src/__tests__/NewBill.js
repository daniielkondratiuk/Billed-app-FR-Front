/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import BillsUI from "../views/BillsUI.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js"
import router from "../app/Router.js"
import store from "../__mocks__/store.js"
import userEvent from "@testing-library/user-event"

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then mail icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', {value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
      await waitFor(() => screen.getByTestId('icon-mail'))
      const windowIcon = screen.getByTestId('icon-mail')
      const activeIcon = windowIcon.classList.contains("active-icon")
      expect(activeIcon).toBeTruthy()
    })
  })
  describe('When I select an image in a correct format', () => {
    test("Then the input file should display the file name", async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({pathname})
      const newBill = new NewBill({document, onNavigate, store, localStorage: window.localStorage})
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const input = screen.getByTestId("file")
      input.addEventListener("change", handleChangeFile)
      fireEvent.change(input, {
        target: {
          files: [
            new File(["image.png"], "image.png", {type: "image/png"}),
            new File(["image.jpeg"], "image.jpeg", {type: "image/jpeg"}),
            new File(["image.jpg"], "image.jpg", {type: "image/jpg"})
          ],
        },
      })
      expect(handleChangeFile).toHaveBeenCalled()
      expect(input.files[0].name).toBe("image.png")
      expect(input.files[1].name).toBe("image.jpeg")
      expect(input.files[2].name).toBe("image.jpg")
    })

    test("Then a bill is created", () => {
      const html = NewBillUI()
      document.body.innerHTML = html
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({pathname})
      const newBill = new NewBill({document, onNavigate, store: null, localStorage: window.localStorage})
      const handleSubmit = jest.fn(newBill.handleSubmit)
      const submit = screen.getByTestId("form-new-bill")
      submit.addEventListener("submit", handleSubmit)
      fireEvent.submit(submit)
      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  // test d'intégration POST
  describe("When I add a new bill", () => {
    test("Then it creates a new bill", () => {
      document.body.innerHTML = NewBillUI()
      const formBill = screen.getByTestId("form-new-bill")
      const mockBill = {
        type: "IT et électronique",
        name: "Macbook Pro",
        datepicker: "2022-11-11",
        amount: "32",
        vat: "99",
        pct: "23",
        commentary: "Macbook Pro M1 2022",
        file: new File(["Macbook"], "Macbook.jpeg", {type: "image/jpeg"}),
      }
      const formInputsValues = {
        type: screen.getByTestId("expense-type"),
        name: screen.getByTestId("expense-name"),
        datepicker: screen.getByTestId("datepicker"),
        amount: screen.getByTestId("amount"),
        vat: screen.getByTestId("vat"),
        pct: screen.getByTestId("pct"),
        commentary: screen.getByTestId("commentary"),
        file: screen.getByTestId("file"),
      }

      fireEvent.change(formInputsValues.type, {target: { value: mockBill.type }})
      expect(formInputsValues.type.value).toBe(mockBill.type)

      fireEvent.change(formInputsValues.name, {target: { value: mockBill.name }})
      expect(formInputsValues.name.value).toBe(mockBill.name)

      fireEvent.change(formInputsValues.datepicker, {target: { value: mockBill.datepicker }})
      expect(formInputsValues.datepicker.value).toBe(mockBill.datepicker)

      fireEvent.change(formInputsValues.amount, {target: { value: mockBill.amount }})
      expect(formInputsValues.amount.value).toBe(mockBill.amount)

      fireEvent.change(formInputsValues.vat, {target: { value: mockBill.vat }})
      expect(formInputsValues.vat.value).toBe(mockBill.vat)

      fireEvent.change(formInputsValues.pct, {target: { value: mockBill.pct }})
      expect(formInputsValues.pct.value).toBe(mockBill.pct)

      fireEvent.change(formInputsValues.commentary, {target: { value: mockBill.commentary }})
      expect(formInputsValues.commentary.value).toBe(mockBill.commentary)

      userEvent.upload(formInputsValues.file, mockBill.file)
      expect(formInputsValues.file.files[0]).toStrictEqual(mockBill.file)
      expect(formInputsValues.file.files).toHaveLength(1)

      // localStorage must be filled with form data
      Object.defineProperty(window, "localStorage", {
        value: {
          getItem: jest.fn(() =>
              JSON.stringify({
                email: "test@test.com",
              })
          )
        },
        writable: true
      })

      //simulate navigation to test it
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({ pathname })
      //init NewBill
      const newBill = new NewBill({document, onNavigate, localStorage: window.localStorage})
      //event trigger
      const handleSubmit = jest.fn(newBill.handleSubmit)
      formBill.addEventListener("submit", handleSubmit)
      fireEvent.submit(formBill)
      expect(handleSubmit).toHaveBeenCalled()
    })
    test("Then it fails with a 404 message error", async () => {
      const html = BillsUI({ error: "Erreur 404" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })
    test("Then it fails with a 500 message error", async () => {
      const html = BillsUI({ error: "Erreur 500" })
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
