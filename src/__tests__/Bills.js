/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import router from "../app/Router.js"
import Bills from "../containers/Bills.js"
import mockStore from "../__mocks__/store"

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee'}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      const activeIcon = windowIcon.classList.contains("active-icon")
      expect(activeIcon).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const billsSortByDate = (a,b) => new Date(b.date) - new Date(a.date)
      document.body.innerHTML = BillsUI({ data: bills.sort(billsSortByDate)})
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
  })
  describe("When I am on Bills Page and I click on the icon eye", () => {
    test("Then it should open the modal", () => {
      const html = BillsUI({data: bills})
      document.body.innerHTML = html
      // init Bills
      const store = null
      const onNavigate = (pathname) => document.body.innerHTML = ROUTES({pathname})

      const billsList = new Bills({document, onNavigate, store, localStorage: window.localStorage})
      // modal window simulation
      $.fn.modal = jest.fn()
      const icon = screen.getAllByTestId("icon-eye")[0]
      const handleClickIconEye = jest.fn(() => billsList.handleClickIconEye(icon))
      icon.addEventListener("click", handleClickIconEye)
      // déclenchement de l'événement
      fireEvent.click(icon)
      expect(handleClickIconEye).toHaveBeenCalled()
      const modale = document.getElementById("modaleFile")
      expect(modale).toBeTruthy()
    })
  })

  describe("When I click on 'Send a new bill' page", () => {
    test("Then I should be sent to 'New bill page'", () => {
      // page bills
      Object.defineProperty(window, "localStorage", {value: localStorageMock,})
      window.localStorage.setItem("user", JSON.stringify({type: "Employee"}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      // init Bills
      const store = null
      const billsList = new Bills({document, onNavigate, store, localStorage: window.localStorage})
      // browse functional
      const newBill = jest.fn(() => billsList.handleClickNewBill)
      const navigationButton = screen.getByTestId("btn-new-bill")
      navigationButton.addEventListener("click", newBill)
      fireEvent.click(navigationButton)
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })
  })
  //test d'intégration GET Bills
  describe('When I navigate to Bills page',  () => {
    test('fetches bills from mock API GET', async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      const pathname = ROUTES_PATH["Bills"]
      root.innerHTML = ROUTES({ pathname: pathname, loading: true })
      const bills = new Bills({document, onNavigate, store: mockStore, localStorage})
      bills.getBills().then((data) => {
        root.innerHTML = BillsUI({ data })
        expect(document.querySelector("tbody").rows.length).toBeGreaterThan(0)
      })
    })
  })

  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(window, 'localStorage', {value: localStorageMock})
      window.localStorage.setItem('user', JSON.stringify({type: 'Employee', email: "e@e"}))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {
      const html = BillsUI({error: "Erreur 404"})
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 404/)
      expect(message).toBeTruthy()
    })

    test("fetches messages from an API and fails with 500 message error", async () => {
      const html = BillsUI({error: "Erreur 500"})
      document.body.innerHTML = html
      const message = await screen.getByText(/Erreur 500/)
      expect(message).toBeTruthy()
    })
  })
})
