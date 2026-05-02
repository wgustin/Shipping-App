# eHub API Documentation (Markdown Export for Google AI Studio)

This file is a cleaned Markdown export of the public eHub API documentation, consolidated for use as instruction/context material in Google AI Studio.

Primary source: https://docs.ehub.com/api-reference

## Table of Contents

- [API Reference](#api-reference)
- [API Versioning](#api-versioning)
- [Authentication](#authentication)
- [Accounts](#accounts)
- [Test](#test)
- [Rates](#rates)
- [Shipments](#shipments)
- [Guides for eHub's Shipment Functionality](#guides-for-ehubs-shipment-functionality)
- [Domestic Shipping](#domestic-shipping)
- [International Shipping](#international-shipping)
- [Additional Tips](#additional-tips)
- [Tracking](#tracking)
- [Create and Ship a Shipment](#create-and-ship-a-shipment)
- [Create and Ship Multiple Shipments](#create-and-ship-multiple-shipments)
- [Retrieve a Shipment](#retrieve-a-shipment)
- [Cancel a Shipment](#cancel-a-shipment)
- [List Shipments](#list-shipments)
- [Validate an address](#validate-an-address)
- [Create Tracking Events for a Shipment](#create-tracking-events-for-a-shipment)
- [Create Tracking Events for Multiple Shipments](#create-tracking-events-for-multiple-shipments)
- [Batches and Manifests](#batches-and-manifests)
- [List Shipment Batches](#list-shipment-batches)
- [Create a Shipments Batch](#create-a-shipments-batch)
- [Create Batches for a Specific Date](#create-batches-for-a-specific-date)
- [Retrieve a Batch](#retrieve-a-batch)
- [Pickups](#pickups)
- [List Pickups](#list-pickups)
- [Check Pickup Availability for Location](#check-pickup-availability-for-location)
- [Request a New Pickup](#request-a-new-pickup)
- [Retrieve a Scheduled Pickup](#retrieve-a-scheduled-pickup)
- [Cancel a Pickup](#cancel-a-pickup)
- [Order Stores](#order-stores)
- [List Order Stores](#list-order-stores)
- [List Orders From an Order Store](#list-orders-from-an-order-store)
- [Retrieve an Order From an Order Store](#retrieve-an-order-from-an-order-store)
- [Ship an Order](#ship-an-order)
- [Cancel an Order's Shipment](#cancel-an-orders-shipment)
- [Create Custom Orders](#create-custom-orders)
- [Update a Custom Order](#update-a-custom-order)
- [Services](#services)
- [Retrieve Services](#retrieve-services)
- [Find Zone](#find-zone)
- [Status](#status)
- [Service Statuses](#service-statuses)
- [Reports](#reports)
- [Shipment Adjustments](#shipment-adjustments)
- [Meter Transactions](#meter-transactions)
- [Webhook Subscriptions](#webhook-subscriptions)
- [List Subscriptions](#list-subscriptions)
- [Create a Subscription](#create-a-subscription)
- [Update a Subscription](#update-a-subscription)
- [Retrieve a Subscription](#retrieve-a-subscription)
- [Delete a Subscription](#delete-a-subscription)
- [Payment Methods](#payment-methods)
- [List Payment Methods](#list-payment-methods)
- [Create a New Payment Method](#create-a-new-payment-method)
- [Update a Payment Method](#update-a-payment-method)
- [Retrieve a Payment Method](#retrieve-a-payment-method)
- [Customers](#customers)
- [List Customers](#list-customers)
- [Retrieve a Customer](#retrieve-a-customer)

---

## API Reference

**Source:** https://docs.ehub.com/api-reference

### Description

### Introduction

eHub is built to help systems optimize order fulfillment with powerful API functionality. Key features include checking shipping rates, purchasing labels, generating manifests, and consolidating orders from multiple ecommerce platforms.

---

### API Overview

The eHub API follows REST principles, making it accessible and easy to use through standard HTTP methods. This guide will walk you through available endpoints, request and response formats, and best practices to help you get the most out of the API.

### Supported Request Body Content Types

The eHub API supports multiple content types for request bodies, ensuring flexibility and compatibility with different data formats. Ensure the Content-Type header in your requests matches the format of your request body.

- Accepted Content Types:
  - `application/json`
  - `application/xml`
  - `application/x-www-form-urlencoded`


Depending on the endpoint, the required content type may vary.  Check the corresponding endpoint documentation for correct usage.

### Rate Limiting and Throttling

The eHub API is optimized to handle high volumes of requests with minimal rate limiting or throttling.

While no strict caps are enforced, for optimal performance, it's recommended to limit parallel requests to a maximum of 10 per API token. Following this guideline helps ensure efficient operation and system reliability.

---

By following these guidelines, you can ensure the best performance and reliability when using the eHub API.

---

## API Versioning

**Source:** https://docs.ehub.com/api-versioning

### Description

The eHub API uses versioning to maintain backward compatibility, allowing new features and updates to be introduced without disrupting existing integrations. Each version is embedded within the URL path, enabling developers to target specific API versions for their applications.

---

### Current Version

The latest available version is **v2**. You can access this version by appending the following path to the base URL:

```
/api/v2/
```

For example, API request URL would look something like this:

`https://api.ehub.com/api/v2/{specific_endpoint}`

### Versioning Strategy

When a new version is released, the previous version remains available to ensure the continuity of your current integration. This approach allows flexibility to upgrade to the latest version when you're ready, allowing you to leverage new features and improvements without disrupting your existing processes.

---

## Authentication

**Source:** https://docs.ehub.com/authentication

### Description

### API Authentication

All requests to the eHub API require authentication via Bearer Token, referred to as an API key in this documentation. each user receives a unique API key, ensuring individual access. If multiple users have API access within the same account, each user will have their own API key.

---

### Obtaining Your API Key

To be assigned an API key, your user account must have the **API role**. To view the API keys for other users within the eHub account, your account must have the `Primary` or `Owner` role.

To locate your API token:

1. Log in to your eHub account at app.ehub.com
2. Navigate to `Settings` → `Users`.
3. Locate your user with the `API` role.
4. Copy the token listed under the `API KEY` field.

You can copy the API key with one click using the copy button to the right of the key.

### Using the API Token

Once you have obtained your API key, include it in the `Authorization` header of your HTTP requests. The token must be prefixed with the word `Bearer` followed by a space, formatted like this:

```
Authorization: Bearer YOUR_API_KEY
```

Example request using the API token:

```
curl --request GET \
	--url https://api.ehub.com/api/v2/test/ping \
	--header 'Authorization: Bearer {your_api_key}' \
	--header 'Content-Type: application/json'
```

Forgetting to include an API key when making a request will lead to an Unauthorized 401 error.

**Status:** 401 - Unauthorized

```

{
    "status": "error",
    "error_code": "errors.insufficient_scope",
    "error_message": "Token does not allow access to service."
}
```

---

## Accounts

**Source:** https://docs.ehub.com/accounts

### Description

eHub offers a flexible **parent-child account structure** that enables users with the appropriate permissions on a parent account to make API requests on behalf of child accounts. This is particularly advantageous for businesses such as 3PLs that manage multiple customers, each with its own shipping carriers and eCommerce platform integrations.

## **API Request Using Parent-Child Relationship**

By leveraging the parent-child relationship, the parent account can make API requests on behalf of the child account using **the parent account's API key**, but targeting the **child account's unique ID**. This avoids the hassle of managing multiple API keys for each child account.

## **Benefits of the Parent-Child Structure**

- **Separation of Data**: Each child account maintains its own set of connections and data, keeping customer-specific data isolated.
- **Centralized Management**: The parent account can easily manage all child accounts using a single API key.
- **Simplified API Requests**: You can execute API requests for child accounts by simply specifying the child account's ID.

## **Endpoints Available for Parent-Child API Requests**

- Rates
- Shipments
- Order Stores

## **Use Case Example**

For instance, if your customer "Child Company A" uses **WooCommerce** and has its own **UPS** shipping account, you can set up a child account in eHub specifically for that customer. This ensures that **all of the data and integrations remain exclusive** to that child account, creating a clean separation between different customer setups.

If the child account's customer ID is **452**, then the parent would make their API request like this:

```
curl --request GET \
	--url https://api.ehub.com/api/v2/cusotmers/452/order_stores \
```

The response to this request will show all eCommerce integration connections for child customer 452.

---

## Test

**Source:** https://docs.ehub.com/test

### Description

### Ping-Pong Test

The Ping Pong Test is a straightforward method used to check the health and availability of an API or system. By sending a "ping" request, the client asks the server if it's operational. If the server is functioning properly, it responds with a "pong." This lightweight request-response mechanism allows for quick diagnostics to confirm that the API is up and running.

### Benefits of the Ping Pong Test:

- **System Health Checks**: Ensures the API is operational.
- **Connectivity Tests**: Verifies successful communication between the client and server.
- **Troubleshooting**: Quickly identifies whether an issue is related to system downtime or connectivity problems.

---

For eHub, the Ping Pong Test helps users ensure the API is online and responsive before moving forward with more complex API calls.

---

## Rates

**Source:** https://docs.ehub.com/rates

### Description

To successfully retrieve rates, you must provide key details. While the shipament object can include additional parameters, the following example highlights the minimum information required to generate accurate rates. The more specific your shipment details are, the more precise your rate results will be. For more information, please refer to the **Rate Request** page for more details and parameters.

### **Minimum Shipment Details (JSON Example)**

```
{
   "shipment":{
      "to_location":{
         "first_name":"string", // or company
         "address1":"string",
         "city":"string",
         "state":"string", // for a US state use the two-digit state code
         "country":"string", // two-digit country code
         "postal_code":"string",
         "phone":"string"
      },      
      "from_location":{
         "company":"Test Test", // or first_name
         "address1":"string",
         "city":"string",
         "state":"string",
         "country":"string",
         "postal_code":"string",
         "phone":"string"
      },
      "parcels":[
         {
            "length":6.0, // inches
            "width":2.0, // inches
            "height":2.0, // inches
            "weight":36.0, // ounces
            "package_type":"string",
         }
      ]
   }
}
```

A request containing only this data will return rates for all enabled services your account qualifies for.  For example, FedEx Ground and FedEx Home Delivery will not return for the same shipment since they are mutually exclusive depending on whether the destination (to_location) is residential or commercial.

If you wish to narrow the results, you can include one of the following parameters within the shipment object.

## Service Filters

You can specify desired services using the `include_services` field, an array containing service IDs. The service IDs can be either an integer or a string that represents the ID of the service you want to retrieve rates for.

### **Service Filter Example (JSON)**

```
{
	"include_services": [
		1172, // USPS Ground Advantage
		"686" // USPS Parcel Select
	]
}
```

Including this array in your request will limit the response to rates for USPS Ground Advantage and USPS Parcel Select only.

## Carrier Filters

To include services from specific carriers only, use the `include_carriers` field:

### **Carrier Filter Example (JSON)**

```
{
  "include_carriers": [
    "usps",
    "fed_ex",
    "dhl_ecommerce"
  ]
}
```

To exclude services from specific carriers, use the `exclude_carriers` field:

### **Exclude Carrier Example (JSON)**

```
{
  "exclude_carriers": [
    "ups",
    "dhl_express"
  ]
}
```

If you omit filtering parameters, all available services will be available for the given shipment, as no specific services or carriers are excluded.

## Warnings

If there are any issues retrieving rates, warnings or error messages from the carrier's API will be relayed back and stored in the `warnings`  array of the response body. This allows for a successful response even if one carrier encounters an issue while others return rates successfully.

### **Warning Example (JSON)**

```
{
  "warnings": [
    "FedEx returned error: Destination postal code missing or invalid"
  ]
}
```

## How to Get FedEx OneRate Rates

To receive FedEx OneRate rates, you need to specify both the eligible package type and service based on the contract in the rating or shipment request. Follow these steps:

1. **Make a** `GET /services` **Call**

In the response, find the service object relevant to the FedEx service that qualifies for FedEx OneRate under the OneRate contract. The service is usually FedEx 2Day but may vary depending on the contract.

### **Example** `GET /services` **Response:**

```
{
   "services": [
      ...
      {
         "service_id": 393, // <------
         "service": "FEDEX_2_DAY",
         "service_code": "fedex_2day",
         "carrier_code": "fed_ex",
         "category": "shipping",
         "package_types": [
            {
               "type": "fedex_pak", // <------
               "name": "FedEx Pak"
            }
         ],
         "sort_order": null
      }
      ...
   ]
}
```

In the service object, check the `package_types` array to find the package type specific to the FedEx OneRate contract. Note the `services[i].package_types[i].type`, as it will be needed later.

**2. Use the** `service_id` **and** `package_type` **in the Rating Request**

The `shipments.parcels[i].package_type` should be set to the package type agreed upon in the FedEx OneRate contract, such as `fedex_pak`

### **Example Rating Request:**

```
{
   "shipment": {
      "to_location": {...},
      "return_location": {...},
      "from_location": {...},
      "parcels": [
         {
            "length": 2.0,
            "width": 2.0,
            "height": 2.0,
            "weight": 3.0,
            "package_type": "fedex_pak", // <------
            "parcel_items": [...]
         }
      ],
      "include_services": [393] // <------ fedex_2day
   }
}
```

---

## Shipments

**Source:** https://docs.ehub.com/shipments

### Description

Fill here with a summary of what can be done with eHub Shipment functionality.

---

### Guides for eHub's Shipment Functionality

### **Domestic Shipping**

- **Create a Shipment**: Initiates a new domestic shipment by providing the destination, origin, parcel details, and selecting a shipping service.
- **Multi-Parcel Shipments**: Supports splitting a shipment into multiple parcels. Multiple labels will be returned, each with different tracking numbers.
- **Label Customization**: Customize the label format (jpeg, png, zpl, etc.), size (4x6, 8.5x11, etc.), and add custom text or images.
- **Cancel a Shipment**: Cancel the shipment and void the label before it’s manifested by the carrier. If successful, the status will return as `cancel_pending`.

### **International Shipping**

- **Customs Information**: When shipping internationally, you must include HS codes, EEL/PFC codes, and detailed customs data to comply with regulations.
- **Retrieve Customs PDF**: Retrieve a customs document in PDF format, supported by certain carriers. Check for carrier availability of this feature.

### **Additional Tips**

- **Dangerous Goods**: Specify hazmat codes in the parcel object to handle hazardous materials. Each parcel can contain only one type of hazardous material.
- **Advanced Labeling Features**: Create custom tracking events for GDE shipments to show package movement even with long periods between label creation and USPS induction.
- **Rates Overview**: Retrieve simplified and organized rates for created shipments, with options to filter by carrier and service level.

### **Tracking**

- **Track Shipments**: Retrieve tracking information manually via GET requests or set up a webhook for real-time updates.
- **Tracking Events**: Create tracking events for GDE shipments to reflect package progress.
- **Retrieve Shipment Status**: Check the status of shipments using eHub’s shipment ID.

Endorsements

- For USPS shipments ONLY.
- Direct the driver on what to do if the package is undeliverable.
- Enum Values:

1. ADDRESS_CORRECTION - Package is returned to sender with the recipient's correct address.
2. CARRIER_LEAVE_IF_NO_RESPONSE - Package is left at the doorstep if the door is not answered. (does not require signature or recipient presence)
3. CHANGE_SERVICE - Sender is notified of an address change for the recipient.
4. FORWARDING_SERVICE - Redirect the package with a recipient's mail forwarding order if one has been filed.
5. RETURN_SERVICE - Return the package to the sender with the reason why the package couldn't be delivered.

---

### **Shipment Features**

eHub's Shipment API provides a powerful and flexible platform for managing all aspects of your shipping operations. With this functionality, you can:

- **Create and Ship Shipments**: Seamlessly create and process shipments by providing key details like addresses, parcel dimensions, and service levels. Easily generate shipping labels and track each shipment’s progress.
- **Create and Ship Multiple Shipments**: Efficiently manage high-volume shipping with the ability to create and ship multiple parcels at once, streamlining your workflow and reducing manual effort.
- **Retrieve a Shipment**: Access detailed information on any shipment with the shipment ID, providing visibility into shipping status and tracking events.
- **Cancel a Shipment**: Cancel shipments before they are processed by the carrier and void labels to avoid unnecessary charges. For USPS, manage refunds based on prepay conditions.
- Create a Shipment: Create a shipment
- **List Shipments:**** **Discover how to retrieve a list of shipments using filters, making it easy to track, audit, and manage high-volume shipping operations.
- **Validate an Address**: Ensure addresses are accurate with address validation, preventing delivery issues and reducing the risk of returns or failed shipments.
- **Customs and International Shipping**: Simplify international shipping with support for customs data, including HS codes and customs PDF document retrieval for select service providers.
- **Track Shipments and Create Tracking Events**: Keep your customers informed with real-time tracking updates through GET requests or webhooks. Create custom tracking events for specific shipments like GDE, ensuring transparency even during long postal induction periods.
- **Rate Management**: Retrieve and compare simplified shipping rates from various carriers, helping you make cost-effective decisions for each shipment.

---

eHub’s Shipment functionality empowers businesses to streamline their shipping operations, manage high-volume orders, and ensure a smooth customer experience across domestic and international shipments.

---

## Guides for eHub's Shipment Functionality

**Source:** https://docs.ehub.com/shipments/guides-for-ehub-s-shipment-functionality

### Endpoint

`GET`

### Description

### Domestic Shipping

- Key requirements for creating a domestic shipment:
  - Vital details like destination and origin addresses.
  - Parcel dimensions and service ID selection.
  - Tips for retrieving rates when service ID is unknown.


### International Shipping

- Extra steps required for international shipments:
  - Importance of HS Codes and EEL/PFC codes.
  - Providing accurate customs data for compliance with regulations.
  - How to calculate declared value and handle shipments to U.S. territories and military locations.


### Additional Tips

- Advanced features and best practices:
  - Handling hazardous materials with hazmat codes.
  - Customizing labels with formats, sizes, text, and images.
  - Managing multi-parcel shipments and creating USPS test labels.


### Tracking

- How to track shipments using the API:
  - Manual tracking through GET requests.
  - Automated tracking through webhooks for real-time updates.
  - Examples of tracking event arrays.


---

### Conclusion

eHub’s Shipment API makes shipping simple, whether you're sending domestic or international packages. With advanced features like label customization, hazmat handling, and real-time tracking, you can streamline your entire shipping process. Whether you're just starting out or handling complex shipments, these guides give you everything you need to succeed.

---

## Domestic Shipping

**Source:** https://docs.ehub.com/shipments/guides-for-ehub-s-shipment-functionality/domestic-shipping

### Endpoint

`GET`

### Description

To successfully create and process a domestic shipment, you must provide the following essential details. While many additional parameters can be added to the shipment object, this example demonstrates the minimum information required to generate a label for a domestic shipment.

```
{
   "shipment":{
      "to_location":{
         "first_name":"string", // or company
         "address1":"string",
         "city":"string",
         "state":"string", // for a US state use the two-digit state code
         "country":"string", // two-digit country code
         "postal_code":"string",
         "phone":"string"
      },      
      "from_location":{
         "company":"Test Test", // or first_name
         "address1":"string",
         "city":"string",
         "state":"string",
         "country":"string",
         "postal_code":"string",
         "phone":"string"
      },
      "parcels":[
         {
            "length":17.0,
            "width":20.0,
            "height":11.0,
            "weight":240.0,
            "package_type":"string"
         }
      ],
      "service_id":1172
   }
}
```

### Shipment Object Breakdown

- **Shipment Object: **The primary container for all shipment-related details.
- **to_location / from_location:** The `to_location` and `from_location` objects are required to define the destination and origin addresses.
- **parcels:** The `parcels` array is necessary to specify the package’s dimensions using the fields `length`, `width`, `height`, `weight`, and `package_type.`
- **service_id:** The `service_id` identifies the shipping service used (e.g., USPS Priority Mail, UPS Ground, or FedEx 2Day).
  - If you're unsure of the correct `service_id` needed, use the Rates endpoint to retrieve available rates and service IDs.


### Errors and Warnings

If any of the required fields are omitted, the system will return an error. For example, if the `parcel` object is missing, you'll see an error message like this:

**Example Error:** **Status:***** ****500 - Internal Server Error*

```
{
    "status": "error",
    "error_code": "parcel.missing_parcels",
    "error_message": "Missing parcels for request. At least one parcel is required."

}
```

### US Territories and Military Shipments

Shipping to a U.S. territory or military destination (APO/FPO) requires using a domestic service with USPS. However, the shipment object also needs additional information such as an HS Tariff Code or EEL/PFC code. Refer to the International Shipments section for more details.

---

## International Shipping

**Source:** https://docs.ehub.com/shipments/guides-for-ehub-s-shipment-functionality/international-shipping

### Endpoint

`GET`

### Description

When shipping internationally, it's critical to provide comprehensive information about your product in your shipment request. Incomplete data can lead to customs rejection, product loss, unhappy customers, and wasted postage due to destination country regulations. For any questions about international shipping, feel free to contact your sales representative or reach out to support at support@ehub.com.

### HS Codes

Harmonized System Codes (HS Codes), also known as Tariff Codes, are required details on customs forms. These codes are mandatory for most USPS customs forms and are also necessary for certain FedEx, UPS, DHL, and other carrier forms. For further details, please refer to Harmonized System (HS) Codes.

### EEL Codes vs PFC Codes

- If the package value exceeds $2,500.00, a PFC code is required instead of an EEL code.
  - Each object within the `parcel_items` array must include the `eel_pfc` field in its `customs_data` object.
  - The ITN will be formatted similarly to "AES X20120502123456". To acquire an ITN, visit the AESDirect website.


### Parcel Items and Customs Data

Customs information for international shipments is included in the `parcel_items` array, with each `parcel_item` object containing a nested `customs_data` object. Refer to the example below:

```
"parcel_items": [
  {
    "name": "string",
    "description": "string",
    "weight": 0.0,
    "quantity": 0.0,
    "price": 0.0,
    "cost": 0.0,
    "customs_data": {
      "content_type": "string",
      "no_delivery": "string",
      "hs_tariff_code": "string",
      "value": 0.0,
      "eel_pfc": "string"
    }
  }
]
```

Depending on the destination country, label creation may fail if the `hs_code` or `eel_pfc` is missing. Even if the destination country doesn’t require these codes, it’s recommended to include them along with an accurate description to prevent delays or errors with customs agencies.

### Declared Value

eHub calculates the declared value of your goods based on the following logic:

```
let declared_value;
if (parcel_item.price) {
    declared_value = parcel_item.price * parcel_item.quantity;
} else {
    declared_value = parcel_item.customs_data.value * parcel_item.quantity;
}
```

### Example Scenario:

The `parcel_item.customs_data.value = 159.00` and the `parcel_item.quantity = 50.0`, the declared value of the parcel is $7,950.00

---

## Additional Tips

**Source:** https://docs.ehub.com/shipments/guides-for-ehub-s-shipment-functionality/additional-tips

### Endpoint

`GET`

### Description

### Dangerous Goods

To indicate that a parcel contains hazardous materials in a Shipment Creation request (POST `/shipments/ship`), include the following parameters in the `parcel` object of the shipment:

```
"service_options": {
  "dangerous_goods": {
    "details": {
      "type": "CLASS_9_NEW_LITHIUM_DEVICE"
    }
  }
}
```

The hazmat code must be specified at `shipment.parcels[i].service_options.dangerous_goods.details.type`. Since each parcel can only contain one type of hazardous material, a multi-parcel shipment can be used to handle various hazmat materials and specify the appropriate hazmat code for each parcel.

### Shipping Label Customizations

Please note that although many customization options are generally available, they are dependent on the carrier's specifications and requirements.

Each of these options is located in the main shipment body and should not be nested within any other object of the shipment request.

### Label Format

eHub can generate labels of different format types. `jpeg`, `png`, `pdf`, `zpl`, `epl2`, `gif`, and `tiff`

For best label quality, we recommend using the `zpl` format with a ZPL-compatible printer.

```
"label_format": "zpl"
```

### Label Size

Typically 4"x6" labels are used but eHub can generate labels with the following sizes. `'4x6'`, `'4x8'`, `'8x11'`, `'8.5x11'`, `'2 5/16x4'`, and `'3 7/16x5 3/16'`

```
"label_size": "4x6"
```

### Label Text and Contents

- `label_text1` /  `label_text2` - Custom text able to be printed on the label
- `label_contents` This object allows for custom text or even an image to be added to the label.

**WARNING: **Each carrier has strict guidelines regarding their shipping labels. Please reach out to support@ehub.com before attempting to utilize this feature.

```
"label_contents": [
  {
    "label_content": {
      "type": "string",
      "text": "string",
      "base64_image": "string",
      "location": [
        0, 0 // X and Y coordinates
      ],
      "width": 0,
      "height": 0
    }
  }
]
```

## Multi Parcel Shipments

Some carriers allow you to split a shipment into multiple parcels by passing several parcel objects within the `parcels` array. If supported, you will receive multiple labels with different tracking numbers.

For any questions, contact support@ehub.com.

```
"parcels":[
  {
    "name": "string",
    "length": 0.0,
    "width": 0.0,
    "height": 0.0,
    "weight": 0.0,
    ...
  },
  {
    "name": "string",
    "length": 0.0,
    "width": 0.0,
    "height": 0.0,
    "weight": 0.0,
    ...
  },
  {
    "name": "string",
    "length": 0.0,
    "width": 0.0,
    "height": 0.0,
    "weight": 0.0,
    ...
  },
]
```

## USPS Test Labels

- All USPS test labels will have "VOID" printed all across the barcode
- The top postage payment area will specify that it is a test label.
- Test labels are not associated with a real Mailer ID or payment account (EPS) and cannot be accepted by the post office.
- Attempting to cancel or void a test label typically results in an error due to USPS limitations.
  - While it’s recommended to develop functionality using test labels, ensure you test the cancellation process with a production label before going live.


## **
**How to Create FedEx OneRate Labels

To create FedEx OneRate shipments, you must specify both the eligible package type and the service in the shipment request body, based on the applicable contract

1. **Specify the Package Type and Service**

Ensure the `package_type` corresponds to the FedEx OneRate contract, such as `fedex_pak`, and the `service_id` is based on the relevant service (usually `fedex_2day`).

**2. Create the Shipment Request**

Use both the corresponding FedEx OneRate `package_type` and `service_id` to create a valid shipment request for a FedEx OneRate shipment:

### **Shipment Request Example:**

```
{
   "shipment": {
      "to_location": {...},
      "return_location": {...},
      "from_location": {...},
      "parcels": [
         {
            "length": 2.0,
            "width": 2.0,
            "height": 2.0,
            "weight": 3.0,
            "package_type": "fedex_pak", // <------ Specified package type
            "parcel_items": [...]
         }
      ],
      "service_id": 393 // <------ FedEx service, e.g., fedex_2day
   }
}
```

---

## Tracking

**Source:** https://docs.ehub.com/shipments/guides-for-ehub-s-shipment-functionality/tracking

### Endpoint

`GET`

### Description

When a shipment is created, the API response will include a tracking number from the specified carrier.

With eHub's API there are two different ways to receive tracking events.

1. **Manually**
  - Make a GET request to /shipments request to retrieve the shipment and all tracking events will be returned in the response.

2. **Webhook**
  - Subscribe to the shipment tracking webhook and receive tracking events as they are sent to eHub.


### Shipment Example `tracking_info` Array

The `tracking_info` array provides detailed information about the shipment's tracking status. This includes the shipment's current status, any updates on the shipment's location, and a list of tracking events that document the progress of the parcel through the carrier's network.

```
"tracking_info": {
    "status": "manifested",
    "updated_at": "2024-08-16T12:00:00.000Z",
    "estimated_delivery_date": null,
    "delivery_date": null,
    "tracking_events": [
        {
            "event_date": "2024-08-16T12:00:00.000Z",
            "status": "manifested",
            "description": "Shipment information sent to FedEx (Processed by shipper and loaded in truck)",
            "city": "BUFFALO",
            "state": "NY",
            "postal_code": "14216",
            "country": "US"
        },
        {
            "event_date": "2024-08-16T08:13:57.000Z",
            "status": "manifested",
            "description": "Shipment information sent to FedEx",
            "city": null,
            "state": null,
            "postal_code": null,
            "country": null
        }
    ]
}
```

### Webhook Example `tracking_events` Array

The `tracking_events` array in the webhook response provides a real-time record of all tracking updates related to a shipment. Each event includes details such as the date, status, description of the event (e.g., "Out for Delivery"), and location information like city, state, postal code, and country. This allows you to monitor a shipment's journey as updates are received directly from the carrier.

```
{
	"tracking_events": [
		{
			"event_date": "2021-08-06T10:06:00.000Z",
			"status": "available_for_pickup",
			"description": "Available for Pickup",
			"city": "MALTA",
			"state": "MT",
			"postal_code": "59538",
			"country": "US"
		},
		{
			"event_date": "2021-08-06T08:41:00.000Z",
			"status": "out_for_delivery",
			"description": "Out for Delivery, Expected Delivery by 9:00pm",
			"city": "MALTA",
			"state": "MT",
			"postal_code": "59538",
			"country": "US"
		},
		{
			"event_date": "2021-08-06T08:30:00.000Z",
			"status": "in_transit",
			"description": "Arrived at Post Office",
			"city": "MALTA",
			"state": "MT",
			"postal_code": "59538",
			"country": "US"
		}
	]
}
```

---

## Create and Ship a Shipment

**Source:** https://docs.ehub.com/shipments/create-and-ship-a-shipment

### Endpoint

`POST /api/v2/shipments/ship`

### Description

To create and ship a shipment all at once, you will need to use the Shipment Creation endpoint to buy and generate a label. Here’s how to structure the request, including the headers, parameters, and body data:

### **Key Elements**

- **shipment**: The main object containing the shipment details.
- **to_location** and **from_location**: The addresses of the sender and recipient.
- **parcels**: The details of the parcel(s), including dimensions, weight, and type.
- **service_id**: The ID of the shipping service you wish to use (can be retrieved via a rates request).
- **label_format**: The format for the label (e.g., "png", "zpl").
- **label_size**: The size of the shipping label (e.g., "4x6").

Once you send this request, the API will return a response with the tracking number and the label, which you can use to ship the package.

### Request Body Fields

- `shipment` (object, required) — Shipment object
  - `order_id` (string, optional) — Order id
  - `account_reference` (string, optional) — Shipment Account Reference
  - `to_location` (object, optional) — Address to ship to
    - `company` (string, optional, example: "Fake Recipient") — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `address1` (string, required, example: "220 S State St") — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required, example: "Salt Lake City") — City of the address
    - `state` (string, required, example: "UT") — State of the address. Use only the 2 digit code
    - `country` (string, required, example: "US") — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required, example: "84111") — Postal code of the address
    - `phone` (string, optional, example: "0000000000") — Phone of the address
    - `email` (string, optional, example: "fake@test.com") — E-mail of the address
  - `from_location` (object, optional) — Address to ship from
    - `company` (string, optional, example: "Fake Sender") — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `address1` (string, required, example: "1150 S Beverly Dr") — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required, example: "LA") — City of the address
    - `state` (string, required, example: "CA") — State of the address. Use only the 2 digit code
    - `country` (string, required, example: "US") — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required, example: "90035") — Postal code of the address
    - `phone` (string, optional, example: "0000000000") — Phone of the address
    - `email` (string, optional, example: "fake@sender.com") — E-mail of the address
  - `return_location` (object, optional) — Return address if different than from location
    - `company` (string, optional, example: "Fake Return") — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required, example: "5855 W Century Blvd") — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required, example: "LA") — City of the address
    - `state` (string, required, example: "CA") — State of the address. Use only the 2 digit code
    - `country` (string, required, example: "US") — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required, example: "90045") — Postal code of the address
    - `phone` (string, optional, example: "0000000000") — Phone of the address
    - `email` (string, optional, example: "fake@return.com") — E-mail of the address
  - `parcels` (array, optional) — Parcels included in shipment
    - `0` (object, optional)
      - `length` (number, optional, example: 6) — measured in inches
      - `width` (number, optional, example: 2) — measured in inches
      - `height` (number, optional, example: 2) — measured in inches
      - `weight` (number, optional, example: 11) — weight of the package in ounces
      - `package_type` (string, optional, example: "parcel")
      - `parcel_items` (array, optional)
        - `0` (object, optional)
          - `id` (number, optional, example: 1877)
          - `item_id` (string, optional, example: "823")
          - `name` (string, optional, example: "Wrist Band")
          - `weight` (number, optional, example: 3)
          - `quantity` (number, optional, example: 2)
          - `price` (number, optional, example: 3.5)
          - `cost` (number, optional, example: 7)
          - `customs_data` (object, optional)
            - `content_type` (string, optional, example: "merchandise")
            - `no_delivery` (string, optional, example: "return")
            - `hs_tariff_code` (string, optional) — Harmonized System Tariff Code
            - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
            - `value` (number, optional, example: 3.5)
        - `1` (object, optional)
          - `id` (number, optional, example: 1878)
          - `item_id` (string, optional, example: "824")
          - `name` (string, optional, example: "Necklace")
          - `weight` (number, optional, example: 5)
          - `quantity` (number, optional, example: 1)
          - `price` (number, optional, example: 10)
          - `cost` (number, optional, example: 10)
          - `customs_data` (object, optional)
            - `content_type` (string, optional, example: "merchandise")
            - `no_delivery` (string, optional, example: "return")
            - `hs_tariff_code` (string, optional) — Harmonized System Tariff Code
            - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
            - `value` (number, optional, example: 10)
      - `customs_data` (object, optional)
        - `content_type` (string, optional, example: "merchandise")
        - `no_delivery` (string, optional, example: "return")
        - `hs_tariff_code` (string, optional) — Harmonized System Tariff Code
        - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
        - `value` (number, optional, example: 13.5)
      - `service_options` (object, optional)
        - `additional_handling` (boolean, optional, example: false)
        - `incoterms` (string, optional, example: "DAP")
        - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED")
        - `dry_ice` (object, optional)
          - `weight` (string, optional, example: "0")
        - `dangerous_goods` (object, optional)
          - `details` (object, optional)
            - `type` (string, optional, example: "CLASS_9_NEW_LITHIUM_DEVICE")
        - `priority_handling` (string, optional, example: "SERVICE_DEFAULT")
        - `alternate_billing` (object, optional) — UPS and FedEx only
          - `billing_type` (string, optional)
          - `bill_to_account_number` (string, optional)
          - `billing_country` (string, optional)
          - `billing_zip` (string, optional)
        - `saturday_delivery` (boolean, optional, example: false)
        - `saturday_pickup` (boolean, optional, example: false)
        - `hold_for_pickup` (boolean, optional, example: false)
        - `hold_for_pickup_options` (object, optional)
          - `notification_recipient` (object, optional)
            - `phone` (string, optional)
          - `pickup_location` (object, optional)
            - `address1` (string, optional)
            - `address2` (string, optional)
            - `address3` (string, optional)
            - `city` (string, optional)
            - `state` (string, optional)
            - `country` (string, optional)
            - `postal_code` (string, optional)
        - `smart_post` (object, optional)
          - `hub_id` (string, optional)
          - `manifest` (string, optional)
        - `endorsement` (string, optional) — USPS Only. Routing directives for handling mail that can’t be delivered as addressed.
        - `onerate` (boolean, optional, example: false)
        - `tax_info` (object, optional)
          - `entity` (String, optional)
          - `tax_id` (string, optional)
          - `type` (String, optional)
          - `country` (string, optional)
  - `service_id` (number, required, example: 1172) — Service ID
  - `ship_date` (string, optional) — Shipment date. Some services support future ship dates (defaults to current date)
  - `label_format` (string, optional, example: "png") — Label Format
  - `label_size` (string, optional, example: "4x6") — Label Size
  - `label_text1` (string, optional) — Custom label text 1 (not supported by all carriers/services)
  - `label_text2` (string, optional) — Custom label text 2 (not supported by all carriers/services)
  - `inline_image` (boolean, optional, example: false) — Flag to include base64 label image in response
  - `label_scale` (number, optional) — Scale factor on postage label contents. Not supported for ZPL format.
  - `ci_comments` (String, optional) — Comments for the shipment's commercial invoice.

### Request Example

```json
{
  "shipment": {
    "order_id": "string",
    "account_reference": "string",
    "to_location": {
      "company": "Fake Recipient",
      "first_name": "string",
      "last_name": "string",
      "address1": "220 S State St",
      "address2": "string",
      "address3": "string",
      "city": "Salt Lake City",
      "state": "UT",
      "country": "US",
      "postal_code": "84111",
      "phone": "0000000000",
      "email": "fake@test.com"
    },
    "from_location": {
      "company": "Fake Sender",
      "first_name": "string",
      "last_name": "string",
      "address1": "1150 S Beverly Dr",
      "address2": "string",
      "address3": "string",
      "city": "LA",
      "state": "CA",
      "country": "US",
      "postal_code": "90035",
      "phone": "0000000000",
      "email": "fake@sender.com"
    },
    "return_location": {
      "company": "Fake Return",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "5855 W Century Blvd",
      "address2": "string",
      "address3": "string",
      "city": "LA",
      "state": "CA",
      "country": "US",
      "postal_code": "90045",
      "phone": "0000000000",
      "email": "fake@return.com"
    },
    "parcels": [
      {
        "length": 6,
        "width": 2,
        "height": 2,
        "weight": 11,
        "package_type": "parcel",
        "parcel_items": [
          {
            "id": 1877,
            "item_id": "823",
            "name": "Wrist Band",
            "weight": 3,
            "quantity": 2,
            "price": 3.5,
            "cost": 7,
            "customs_data": {
              "content_type": "merchandise",
              "no_delivery": "return",
              "hs_tariff_code": "string",
              "eel_pfc": "string",
              "value": 3.5
            }
          }
        ],
        "customs_data": {
          "content_type": "merchandise",
          "no_delivery": "return",
          "hs_tariff_code": "string",
          "eel_pfc": "string",
          "value": 13.5
        },
        "service_options": {
          "additional_handling": false,
          "incoterms": "DAP",
          "delivery_confirmation": "NO_SIGNATURE_REQUIRED",
          "dry_ice": {
            "weight": "0"
          },
          "dangerous_goods": {
            "details": {
              "type": "CLASS_9_NEW_LITHIUM_DEVICE"
            }
          },
          "priority_handling": "SERVICE_DEFAULT",
          "alternate_billing": {
            "billing_type": "string",
            "bill_to_account_number": "string",
            "billing_country": "string",
            "billing_zip": "string"
          },
          "saturday_delivery": false,
          "saturday_pickup": false,
          "hold_for_pickup": false,
          "hold_for_pickup_options": {
            "notification_recipient": {
              "phone": "string"
            },
            "pickup_location": {
              "address1": "string",
              "address2": "string",
              "address3": "string",
              "city": "string",
              "state": "string",
              "country": "string",
              "postal_code": "string"
            }
          },
          "smart_post": {
            "hub_id": "string",
            "manifest": "string"
          },
          "endorsement": "string",
          "onerate": false,
          "tax_info": {
            "entity": null,
            "tax_id": "string",
            "type": null,
            "country": "string"
          }
        }
      }
    ],
    "service_id": 1172,
    "ship_date": "string",
    "label_format": "png",
    "label_size": "4x6",
    "label_text1": "string",
    "label_text2": "string",
    "inline_image": false,
    "label_scale": 0,
    "ci_comments": null
  }
}
```

### Responses

#### Response 1 — `201`

Create and Ship a Shipment

**Response Fields**

- `shipment` (object, optional) — Shipment object
  - `id` (integer, optional) — Shipment id
  - `external_id` (string, optional) — Shipment external id
  - `order_id` (string, optional) — Order id
  - `account_reference` (string, optional) — Shipment Account Reference
  - `batch_id` (integer, optional) — Shipment batch id
  - `pickup_id` (integer, optional) — Shipment pickup id
  - `to_location` (object, optional) — Address to ship to
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `from_location` (object, optional) — Address to ship from
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `return_location` (object, optional) — Return address if different than from location
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `parcels` (array, optional) — Parcels included in shipment
  - `status` (string, optional) — Shipment status
  - `shipping_service` (object, optional) — Service's rate for this shipment
    - `service` (string, optional) — Service name
    - `service_id` (integer, optional) — Service unique identifier
    - `service_code` (string, optional) — Service code
    - `carrier_code` (string, optional) — Carrier code
    - `rate` (number, optional) — Service rate
    - `meter_rate` (number, optional) — Service meter rate
    - `delivery_days` (integer, optional) — Delivery days
    - `delivery_date` (string, optional) — Delivery date
    - `delivery_guaranteed` (boolean, optional, example: false) — Is a delivery guaranteed?
  - `tracking_number` (string, optional) — Tracking number
  - `shipped_at` (string, optional) — Date/Time shipment marked as shipped
  - `created_at` (string, optional) — Created date
  - `updated_at` (string, optional) — Updated date
  - `label_text1` (string, optional) — Label Text 1
  - `label_text2` (string, optional) — Label Text 2
  - `price_group` (string, optional) — Price Group/Zone

**Response Example**

```json
{
  "shipment": {
    "id": 0,
    "external_id": "string",
    "order_id": "string",
    "account_reference": "string",
    "batch_id": 0,
    "pickup_id": 0,
    "to_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "from_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "return_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "parcels": [],
    "status": "string",
    "shipping_service": {
      "service": "string",
      "service_id": 0,
      "service_code": "string",
      "carrier_code": "string",
      "rate": 0,
      "meter_rate": 0,
      "delivery_days": 0,
      "delivery_date": "string",
      "delivery_guaranteed": false
    },
    "tracking_number": "string",
    "shipped_at": "string",
    "created_at": "string",
    "updated_at": "string",
    "label_text1": "string",
    "label_text2": "string",
    "price_group": "string"
  }
}
```

---

## Create and Ship Multiple Shipments

**Source:** https://docs.ehub.com/shipments/create-and-ship-multiple-shipments

### Endpoint

`POST /api/v2/shipments/ship_multiple`

### Description

This endpoint allows you to create up to 10 shipments in a single request. It will buy and return labels for each shipment. The body of the request should be an array of shipment objects, formatted similarly to the `shipments/ship` endpoint.

### **Key Elements**

- **shipments**: An array containing up to 10 shipment objects.
- **shipment**: Each shipment object includes `to_location`, `from_location`, `parcels`, and shipping service details.
- **to_location** and **from_location**: Sender and recipient addresses for each shipment.
- **parcels**: Details of each package including dimensions, weight, and package type.
- **service_id**: Shipping service ID for the carrier.
- **label_format**: Specify the format for the label (e.g., "png", "zpl").
- **label_size**: Size of the shipping label (e.g., "4x6").

Once the request is sent, the API will return the tracking numbers and labels for each shipment in the array.

### Request Body Fields

- `shipments` (array, required) — Shipment objects
  - `0` (object, optional)
    - `order_id` (string, optional)
    - `account_reference` (string, optional)
    - `to_location` (object, optional)
      - `company` (string, optional, example: "Fake Recipient")
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `address1` (string, optional, example: "220 S State St")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Salt Lake City")
      - `state` (string, optional, example: "UT")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "84111")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "fake@test.com")
    - `from_location` (object, optional)
      - `company` (string, optional, example: "Fake Sender")
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `address1` (string, optional, example: "1150 S Beverly Dr")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "LA")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90035")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "fake@sender.com")
    - `return_location` (object, optional)
      - `company` (string, optional, example: "Fake Return")
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `nick_name` (string, optional)
      - `address1` (string, optional, example: "5855 W Century Blvd")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "LA")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90045")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "fake@return.com")
    - `parcels` (array, optional)
      - `0` (object, optional)
        - `length` (number, optional, example: 6) — measured in inches
        - `width` (number, optional, example: 2) — measured in inches
        - `height` (number, optional, example: 2) — measured in inches
        - `weight` (number, optional, example: 11) — weight of the package in ounces
        - `package_type` (string, optional, example: "parcel")
        - `parcel_items` (array, optional)
          - `0` (object, optional)
            - `id` (number, optional, example: 1877)
            - `item_id` (string, optional, example: "823")
            - `name` (string, optional, example: "Wrist Band")
            - `weight` (number, optional, example: 3)
            - `quantity` (number, optional, example: 2)
            - `price` (number, optional, example: 3.5)
            - `cost` (number, optional, example: 7)
            - `customs_data` (object, optional)
              - `content_type` (string, optional, example: "merchandise")
              - `no_delivery` (string, optional, example: "return")
              - `hs_tariff_code` (string, optional)
              - `eel_pfc` (string, optional)
              - `value` (number, optional, example: 3.5)
          - `1` (object, optional)
            - `id` (number, optional, example: 1878)
            - `item_id` (string, optional, example: "824")
            - `name` (string, optional, example: "Necklace")
            - `weight` (number, optional, example: 5)
            - `quantity` (number, optional, example: 1)
            - `price` (number, optional, example: 10)
            - `cost` (number, optional, example: 10)
            - `customs_data` (object, optional)
              - `content_type` (string, optional, example: "merchandise")
              - `no_delivery` (string, optional, example: "return")
              - `hs_tariff_code` (string, optional)
              - `eel_pfc` (string, optional)
              - `value` (number, optional, example: 10)
        - `customs_data` (object, optional)
          - `content_type` (string, optional, example: "merchandise")
          - `no_delivery` (string, optional, example: "return")
          - `hs_tariff_code` (string, optional)
          - `eel_pfc` (string, optional)
          - `value` (number, optional, example: 13.5)
        - `service_options` (object, optional)
          - `additional_handling` (boolean, optional, example: false)
          - `incoterms` (string, optional)
          - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED")
          - `dry_ice` (object, optional)
            - `weight` (string, optional)
          - `dangerous_goods` (object, optional)
            - `details` (object, optional)
              - `type` (string, optional)
          - `priority_handling` (string, optional, example: "SERVICE_DEFAULT")
          - `alternate_billing` (object, optional)
            - `billing_type` (string, optional)
            - `bill_to_account_number` (string, optional)
            - `billing_country` (string, optional)
            - `billing_zip` (string, optional)
          - `saturday_deliver` (boolean, optional, example: false)
          - `saturday_pickup` (boolean, optional, example: false)
          - `hold_for_pickup` (boolean, optional, example: false)
          - `hold_for_pickup_options` (object, optional)
            - `notification_recipient` (object, optional)
              - `phone` (string, optional)
            - `pickup_location` (object, optional)
              - `address1` (string, optional)
              - `address2` (string, optional)
              - `address3` (string, optional)
              - `city` (string, optional)
              - `state` (string, optional)
              - `country` (string, optional)
              - `postal_code` (string, optional)
          - `smart_post` (object, optional)
            - `hub_id` (string, optional)
            - `manifest` (string, optional)
          - `endorsement` (string, optional)
          - `onerate` (boolean, optional, example: false)
    - `service_id` (number, optional, example: 1172)
    - `ship_date` (string, optional)
    - `label_format` (string, optional, example: "png")
    - `label_size` (string, optional, example: "4x6")
    - `label_text1` (string, optional)
    - `label_text2` (string, optional)
    - `inline_image` (boolean, optional, example: false)
    - `label_scale` (string, optional)
    - `ci_comments` (String, optional) — Comments for the shipment's commercial invoice.
  - `1` (object, optional)
    - `order_id` (string, optional)
    - `account_reference` (string, optional)
    - `to_location` (object, optional)
      - `company` (string, optional, example: "Fake Recipient")
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `address1` (string, optional, example: "220 S State St")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Salt Lake City")
      - `state` (string, optional, example: "UT")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "84111")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "fake@test.com")
    - `from_location` (object, optional)
      - `company` (string, optional, example: "Fake Sender")
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `address1` (string, optional, example: "1150 S Beverly Dr")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "LA")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90035")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "fake@sender.com")
    - `return_location` (object, optional)
      - `company` (string, optional, example: "Fake Return")
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `nick_name` (string, optional)
      - `address1` (string, optional, example: "5855 W Century Blvd")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "LA")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90045")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "fake@return.com")
    - `parcels` (array, optional)
      - `0` (object, optional)
        - `length` (number, optional, example: 6) — measured in inches
        - `width` (number, optional, example: 2) — measured in inches
        - `height` (number, optional, example: 2) — measured in inches
        - `weight` (number, optional, example: 11) — weight of the package in ounces
        - `package_type` (string, optional, example: "parcel")
        - `parcel_items` (array, optional)
          - `0` (object, optional)
            - `id` (number, optional, example: 1877)
            - `item_id` (string, optional, example: "823")
            - `name` (string, optional, example: "Wrist Band")
            - `weight` (number, optional, example: 3)
            - `quantity` (number, optional, example: 2)
            - `price` (number, optional, example: 3.5)
            - `cost` (number, optional, example: 7)
            - `customs_data` (object, optional)
              - `content_type` (string, optional, example: "merchandise")
              - `no_delivery` (string, optional, example: "return")
              - `hs_tariff_code` (string, optional)
              - `eel_pfc` (string, optional)
              - `value` (number, optional, example: 3.5)
          - `1` (object, optional)
            - `id` (number, optional, example: 1878)
            - `item_id` (string, optional, example: "824")
            - `name` (string, optional, example: "Necklace")
            - `weight` (number, optional, example: 5)
            - `quantity` (number, optional, example: 1)
            - `price` (number, optional, example: 10)
            - `cost` (number, optional, example: 10)
            - `customs_data` (object, optional)
              - `content_type` (string, optional, example: "merchandise")
              - `no_delivery` (string, optional, example: "return")
              - `hs_tariff_code` (string, optional)
              - `eel_pfc` (string, optional)
              - `value` (number, optional, example: 10)
        - `customs_data` (object, optional)
          - `content_type` (string, optional, example: "merchandise")
          - `no_delivery` (string, optional, example: "return")
          - `hs_tariff_code` (string, optional)
          - `eel_pfc` (string, optional)
          - `value` (number, optional, example: 13.5)
        - `service_options` (object, optional)
          - `additional_handling` (boolean, optional, example: false)
          - `incoterms` (string, optional)
          - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED")
          - `dry_ice` (object, optional)
            - `weight` (string, optional)
          - `dangerous_goods` (object, optional)
            - `details` (object, optional)
              - `type` (string, optional)
          - `priority_handling` (string, optional, example: "SERVICE_DEFAULT")
          - `alternate_billing` (object, optional)
            - `billing_type` (string, optional)
            - `bill_to_account_number` (string, optional)
            - `billing_country` (string, optional)
            - `billing_zip` (string, optional)
          - `saturday_deliver` (boolean, optional, example: false)
          - `saturday_pickup` (boolean, optional, example: false)
          - `hold_for_pickup` (boolean, optional, example: false)
          - `hold_for_pickup_options` (object, optional)
            - `notification_recipient` (object, optional)
              - `phone` (string, optional)
            - `pickup_location` (object, optional)
              - `address1` (string, optional)
              - `address2` (string, optional)
              - `address3` (string, optional)
              - `city` (string, optional)
              - `state` (string, optional)
              - `country` (string, optional)
              - `postal_code` (string, optional)
          - `smart_post` (object, optional)
            - `hub_id` (string, optional)
            - `manifest` (string, optional)
          - `endorsement` (string, optional)
          - `onerate` (boolean, optional, example: false)
    - `service_id` (number, optional, example: 1172)
    - `ship_date` (string, optional)
    - `label_format` (string, optional, example: "png")
    - `label_size` (string, optional, example: "4x6")
    - `label_text1` (string, optional)
    - `label_text2` (string, optional)
    - `inline_image` (boolean, optional, example: false)
    - `label_scale` (string, optional)
    - `ci_comments` (string, optional) — Comments for the shipment's commercial invoice.

### Request Example

```json
{
  "shipments": [
    {
      "order_id": "string",
      "account_reference": "string",
      "to_location": {
        "company": "Fake Recipient",
        "first_name": "string",
        "last_name": "string",
        "address1": "220 S State St",
        "address2": "string",
        "address3": "string",
        "city": "Salt Lake City",
        "state": "UT",
        "country": "US",
        "postal_code": "84111",
        "phone": "0000000000",
        "email": "fake@test.com"
      },
      "from_location": {
        "company": "Fake Sender",
        "first_name": "string",
        "last_name": "string",
        "address1": "1150 S Beverly Dr",
        "address2": "string",
        "address3": "string",
        "city": "LA",
        "state": "CA",
        "country": "US",
        "postal_code": "90035",
        "phone": "0000000000",
        "email": "fake@sender.com"
      },
      "return_location": {
        "company": "Fake Return",
        "first_name": "string",
        "last_name": "string",
        "nick_name": "string",
        "address1": "5855 W Century Blvd",
        "address2": "string",
        "address3": "string",
        "city": "LA",
        "state": "CA",
        "country": "US",
        "postal_code": "90045",
        "phone": "0000000000",
        "email": "fake@return.com"
      },
      "parcels": [
        {
          "length": 6,
          "width": 2,
          "height": 2,
          "weight": 11,
          "package_type": "parcel",
          "parcel_items": [
            {
              "id": 1877,
              "item_id": "823",
              "name": "Wrist Band",
              "weight": 3,
              "quantity": 2,
              "price": 3.5,
              "cost": 7,
              "customs_data": {
                "content_type": "merchandise",
                "no_delivery": "return",
                "hs_tariff_code": "string",
                "eel_pfc": "string",
                "value": 3.5
              }
            }
          ],
          "customs_data": {
            "content_type": "merchandise",
            "no_delivery": "return",
            "hs_tariff_code": "string",
            "eel_pfc": "string",
            "value": 13.5
          },
          "service_options": {
            "additional_handling": false,
            "incoterms": "string",
            "delivery_confirmation": "NO_SIGNATURE_REQUIRED",
            "dry_ice": {
              "weight": "string"
            },
            "dangerous_goods": {
              "details": {
                "type": "string"
              }
            },
            "priority_handling": "SERVICE_DEFAULT",
            "alternate_billing": {
              "billing_type": "string",
              "bill_to_account_number": "string",
              "billing_country": "string",
              "billing_zip": "string"
            },
            "saturday_deliver": false,
            "saturday_pickup": false,
            "hold_for_pickup": false,
            "hold_for_pickup_options": {
              "notification_recipient": {
                "phone": "string"
              },
              "pickup_location": {
                "address1": "string",
                "address2": "string",
                "address3": "string",
                "city": "string",
                "state": "string",
                "country": "string",
                "postal_code": "string"
              }
            },
            "smart_post": {
              "hub_id": "string",
              "manifest": "string"
            },
            "endorsement": "string",
            "onerate": false
          }
        }
      ],
      "service_id": 1172,
      "ship_date": "string",
      "label_format": "png",
      "label_size": "4x6",
      "label_text1": "string",
      "label_text2": "string",
      "inline_image": false,
      "label_scale": "string",
      "ci_comments": null
    }
  ]
}
```

### Responses

#### Response 1 — `201`

Create and Ship Multiple Shipments

**Response Fields**

- `shipments` (array, optional) — Shipment objects
  - `` (array, optional) — Shipment objects
    - `id` (integer, optional) — Shipment id
    - `external_id` (string, optional) — Shipment external id
    - `order_id` (string, optional) — Order id
    - `account_reference` (string, optional) — Shipment Account Reference
    - `batch_id` (integer, optional) — Shipment batch id
    - `pickup_id` (integer, optional) — Shipment pickup id
    - `to_location` (object, optional) — Address to ship to
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `from_location` (object, optional) — Address to ship from
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `return_location` (object, optional) — Return address if different than from location
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `parcels` (array, optional) — Parcels included in shipment
      - `` (array, optional) — Parcels included in shipment
        - `id` (integer, optional) — Parcel unique identifier
        - `length` (number, optional) — Parcel length
        - `width` (number, optional) — Parcel width
        - `height` (number, optional) — Parcel height
        - `weight` (number, optional) — Weight of shipment
        - `package_type` (string, optional) — Package Type
        - `created_at` (string, optional) — Parcel created time
        - `updated_at` (string, optional) — Parcel last updated time
        - `external_shipment_id` (string, optional) — External shipment id
        - `tracking_number` (string, optional) — Tracking number
        - `shipping_cost` (number, optional) — Cost of shipment
        - `shipping_cost_details` (array, optional) — Shipping cost details
          - `` (array, optional) — Shipping cost details
            - `cost_type` (string, optional) — Cost type
            - `description` (string, optional) — Description
            - `rate` (number, optional) — Service rate
        - `meter_cost` (number, optional) — Meter cost for shipment
        - `meter_cost_details` (array, optional) — Meter cost details
          - `` (array, optional) — Meter cost details
            - `cost_type` (string, optional) — Cost type
            - `description` (string, optional) — Description
            - `rate` (number, optional) — Service rate
        - `status` (string, optional) — Parcel status
        - `parcel_items` (array, optional) — Parcel's items
          - `` (array, optional) — Parcel's items
            - `id` (integer, optional) — Id of item
            - `item_id` (string, optional) — Item id (secondary)
            - `name` (string, optional) — Name of product
            - `accounting_number` (string, optional) — Accounting system identifier for product
            - `variant_name` (string, optional) — Name of variant (if applicable)
            - `variant_id` (integer, optional) — ID of variant (if applicable)
            - `variant_option1` (string, optional) — Variant option (e.g. large)
            - `variant_option2` (string, optional) — Variant option (e.g. red)
            - `variant_option3` (string, optional) — Variant option (e.g. long)
            - `image_src` (string, optional) — URL of the product image
            - `external_id` (string, optional) — External system id, code, or identifier for item
            - `sku` (string, optional) — SKU
            - `weight` (number, optional) — Weight of product
            - `length` (number, optional) — Length of product
            - `width` (number, optional) — Width of product
            - `height` (number, optional) — Height of product
            - `quantity` (number, optional) — Quantity of product
            - `price` (number, optional) — Price per quantity of product
            - `cost` (number, optional) — Total cost of quantity ordered
            - `country_of_origin` (string, optional) — Country of origin, 2 digit code.
            - `customs_data` (object, optional) — Customs data
              - `content_type` (string, optional, example: "merchandise") — Content type of customs data
              - `no_delivery` (string, optional) — What to do if no delivery
              - `hs_tariff_code` (string, optional) — HS tariff code
              - `value` (number, optional) — Value
              - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
        - `customs_data` (object, optional) — Customs data
          - `content_type` (string, optional, example: "merchandise") — Content type of customs data
          - `no_delivery` (string, optional) — What to do if no delivery
          - `hs_tariff_code` (string, optional) — HS tariff code
          - `value` (number, optional) — Value
          - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
        - `postage_label` (object, optional) — Postage label
          - `id` (integer, optional) — Label unique identifier
          - `dims` (string, optional) — Label dimensions
          - `resolution` (integer, optional) — Label resolution
          - `status` (string, optional) — Postage label status
          - `image_url` (string, optional) — Label image URL
          - `created_at` (string, optional) — Label created time
          - `updated_at` (string, optional) — Label last updated time
          - `base64_image` (string, optional) — base64 encoded image
        - `ship_date` (string, optional) — Ship date
        - `shipped_at` (string, optional) — Date/time parcel marked as shipped
        - `description` (string, optional) — Parcel description
        - `service_options` (object, optional) — Service options
          - `additional_handling` (boolean, optional) — AdditionalHandlingIndicator
          - `incoterms` (string, optional, example: "DDU") — Incoterms
          - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED") — Delivery Confirmation, including signature requirements, for the parcel.
          - `dry_ice` (object, optional) — Information about dry ice contained in the parcel.
            - `weight` (number, optional) — Weight (lbs.) of dry ice.
          - `dangerous_goods` (object, optional) — Dangerous goods declaration. The format of this data may be specific to a provider.
            - `details` (object, optional) — Detailed dangerous goods information.
              - `type` (string, optional, example: "CLASS_9_NEW_LITHIUM_DEVICE") — The format of this data may be specific to a provider.
          - `priority_handling` (string, optional, example: "SERVICE_DEFAULT") — Indicates priority handling. Can be carrier-specific and may incur significant extra charges on the parcel.
          - `alternate_billing` (object, optional) — Bill the charges to someone other than the sender.
            - `billing_type` (string, optional, example: "THIRD_PARTY") — Alternate billing type.
            - `bill_to_account_number` (string, optional) — Bill to account number.
            - `billing_country` (string, optional) — Origin Country of Billing Account (required for THIRD_PARTY only)
            - `billing_zip` (string, optional) — Origin Postal Code of Billing Account (required for THIRD_PARTY and RECEIVER)
          - `saturday_delivery` (boolean, optional) — Saturday delivery.
          - `saturday_pickup` (boolean, optional) — Saturday pickup.
          - `hold_for_pickup` (boolean, optional)
          - `hold_for_pickup_options` (object, optional) — Hold for pickup options.
            - `notification_recipient` (object, optional)
              - `phone` (string, optional)
            - `pickup_location` (object, optional)
              - `address1` (string, required) — Line 1 of the address
              - `address2` (string, optional) — Line 2 of the address
              - `address3` (string, optional) — Line 3 of the address
              - `city` (string, required) — City of the address
              - `state` (string, required) — State of the address. Use only the 2 digit code
              - `country` (string, required) — Country of the address. Use only the 2 digit code
              - `postal_code` (string, required) — Postal code of the address
          - `smart_post` (object, optional) — FedEx SmartPost details
            - `hub_id` (integer, optional) — Numeric FedEx SmartPost hub identifier
            - `manifest` (string, optional) — Manifest identifier
          - `endorsement` (string, optional, example: "ADDRESS_CORRECTION") — USPS endorsement type
          - `onerate` (boolean, optional) — FedEx Onerate service option. Can only be used with FedEx services.
        - `tracking_info` (object, optional) — Tracking information
          - `status` (string, optional) — Current status
          - `updated_at` (string, optional) — Last tracking update date/time
          - `estimated_delivery_date` (string, optional) — Estimated delivery date/time
          - `delivery_date` (string, optional) — Delivery date/time
          - `tracking_events` (array, optional) — List of tracking event details
            - `` (array, optional) — List of tracking event details
              - `event_date` (string, optional) — Date and time of tracking event
              - `status` (string, optional) — Status for tracking event
              - `description` (string, optional) — Description of tracking event
              - `city` (string, optional) — Location city of tracking event
              - `state` (string, optional) — Location state of tracking event
              - `postal_code` (string, optional) — Location postal code of tracking event
              - `country` (string, optional) — Location country of tracking event
        - `rate_calc_type` (string, optional) — Rate calculation type
    - `status` (string, optional) — Shipment status
    - `shipping_service` (object, optional) — Service's rate for this shipment
      - `service` (string, optional) — Service name
      - `service_id` (integer, optional) — Service unique identifier
      - `service_code` (string, optional) — Service code
      - `carrier_code` (string, optional) — Carrier code
      - `rate` (number, optional) — Service rate
      - `meter_rate` (number, optional) — Service meter rate
      - `delivery_days` (integer, optional) — Delivery days
      - `delivery_date` (string, optional) — Delivery date
      - `delivery_guaranteed` (boolean, optional) — Is a delivery guaranteed?
    - `tracking_number` (string, optional) — Tracking number
    - `shipped_at` (string, optional) — Date/Time shipment marked as shipped
    - `created_at` (string, optional) — Created date
    - `updated_at` (string, optional) — Updated date
    - `label_text1` (string, optional) — Label Text 1
    - `label_text2` (string, optional) — Label Text 2
    - `price_group` (string, optional) — Price Group/Zone
- `payment` (object, optional) — Shipment payment
  - `currency` (string, optional) — Currency of amount (default = USD)
  - `amount` (number, optional) — Amount to capture (default = 0)
  - `amount_includes_shipping` (boolean, optional) — Amount includes shipping
  - `payment_method_id` (integer, optional) — Primary identifier for saved payment method.  Used in place of credit card info.  Not used if not defined.
  - `payment_transaction_id` (integer, optional) — Ehub Payment Transaction ID.

**Response Example**

```json
{
  "shipments": [
    [
      0
    ]
  ],
  "payment": {
    "currency": "string",
    "amount": 0,
    "amount_includes_shipping": false,
    "payment_method_id": 0,
    "payment_transaction_id": 0
  }
}
```

---

## Retrieve a Shipment

**Source:** https://docs.ehub.com/shipments/retrieve-a-shipment

### Endpoint

`GET /api/v2/shipments/{id}`

### Description

This endpoint allows you to retrieve a specific shipment using its `shipment.id`.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Retrieve a Shipment

**Response Fields**

- `shipment` (object, optional) — Shipment object
  - `id` (integer, optional) — Shipment id
  - `external_id` (string, optional) — Shipment external id
  - `order_id` (string, optional) — Order id
  - `account_reference` (string, optional) — Shipment Account Reference
  - `batch_id` (integer, optional) — Shipment batch id
  - `pickup_id` (integer, optional) — Shipment pickup id
  - `to_location` (object, optional) — Address to ship to
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `from_location` (object, optional) — Address to ship from
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `return_location` (object, optional) — Return address if different than from location
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `parcels` (array, optional) — Parcels included in shipment
    - `` (array, optional) — Parcels included in shipment
      - `id` (integer, optional) — Parcel unique identifier
      - `length` (number, optional) — Parcel length
      - `width` (number, optional) — Parcel width
      - `height` (number, optional) — Parcel height
      - `weight` (number, optional) — Weight of shipment
      - `package_type` (string, optional) — Package Type
      - `created_at` (string, optional) — Parcel created time
      - `updated_at` (string, optional) — Parcel last updated time
      - `external_shipment_id` (string, optional) — External shipment id
      - `tracking_number` (string, optional) — Tracking number
      - `shipping_cost` (number, optional) — Cost of shipment
      - `shipping_cost_details` (array, optional) — Shipping cost details
        - `` (array, optional) — Shipping cost details
          - `cost_type` (string, optional) — Cost type
          - `description` (string, optional) — Description
          - `rate` (number, optional) — Service rate
      - `meter_cost` (number, optional) — Meter cost for shipment
      - `meter_cost_details` (array, optional) — Meter cost details
        - `` (array, optional) — Meter cost details
          - `cost_type` (string, optional) — Cost type
          - `description` (string, optional) — Description
          - `rate` (number, optional) — Service rate
      - `status` (string, optional) — Parcel status
      - `parcel_items` (array, optional) — Parcel's items
        - `` (array, optional) — Parcel's items
          - `id` (integer, optional) — Id of item
          - `item_id` (string, optional) — Item id (secondary)
          - `name` (string, optional) — Name of product
          - `accounting_number` (string, optional) — Accounting system identifier for product
          - `variant_name` (string, optional) — Name of variant (if applicable)
          - `variant_id` (integer, optional) — ID of variant (if applicable)
          - `variant_option1` (string, optional) — Variant option (e.g. large)
          - `variant_option2` (string, optional) — Variant option (e.g. red)
          - `variant_option3` (string, optional) — Variant option (e.g. long)
          - `image_src` (string, optional) — URL of the product image
          - `external_id` (string, optional) — External system id, code, or identifier for item
          - `sku` (string, optional) — SKU
          - `weight` (number, optional) — Weight of product
          - `length` (number, optional) — Length of product
          - `width` (number, optional) — Width of product
          - `height` (number, optional) — Height of product
          - `quantity` (number, optional) — Quantity of product
          - `price` (number, optional) — Price per quantity of product
          - `cost` (number, optional) — Total cost of quantity ordered
          - `country_of_origin` (string, optional) — Country of origin, 2 digit code.
          - `customs_data` (object, optional) — Customs data
            - `content_type` (string, optional, example: "merchandise") — Content type of customs data
            - `no_delivery` (string, optional) — What to do if no delivery
            - `hs_tariff_code` (string, optional) — HS tariff code
            - `value` (number, optional) — Value
            - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
      - `customs_data` (object, optional) — Customs data
        - `content_type` (string, optional, example: "merchandise") — Content type of customs data
        - `no_delivery` (string, optional) — What to do if no delivery
        - `hs_tariff_code` (string, optional) — HS tariff code
        - `value` (number, optional) — Value
        - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
      - `postage_label` (object, optional) — Postage label
        - `id` (integer, optional) — Label unique identifier
        - `dims` (string, optional) — Label dimensions
        - `resolution` (integer, optional) — Label resolution
        - `status` (string, optional) — Postage label status
        - `image_url` (string, optional) — Label image URL
        - `created_at` (string, optional) — Label created time
        - `updated_at` (string, optional) — Label last updated time
        - `base64_image` (string, optional) — base64 encoded image
      - `ship_date` (string, optional) — Ship date
      - `shipped_at` (string, optional) — Date/time parcel marked as shipped
      - `description` (string, optional) — Parcel description
      - `service_options` (object, optional) — Service options
        - `additional_handling` (boolean, optional) — AdditionalHandlingIndicator
        - `incoterms` (string, optional, example: "DDU") — Incoterms
        - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED") — Delivery Confirmation, including signature requirements, for the parcel.
        - `dry_ice` (object, optional) — Information about dry ice contained in the parcel.
          - `weight` (number, optional) — Weight (lbs.) of dry ice.
        - `dangerous_goods` (object, optional) — Dangerous goods declaration. The format of this data may be specific to a provider.
          - `details` (object, optional) — Detailed dangerous goods information.
            - `type` (string, optional, example: "CLASS_9_NEW_LITHIUM_DEVICE") — The format of this data may be specific to a provider.
        - `priority_handling` (string, optional, example: "SERVICE_DEFAULT") — Indicates priority handling. Can be carrier-specific and may incur significant extra charges on the parcel.
        - `alternate_billing` (object, optional) — Bill the charges to someone other than the sender.
          - `billing_type` (string, optional, example: "THIRD_PARTY") — Alternate billing type.
          - `bill_to_account_number` (string, optional) — Bill to account number.
          - `billing_country` (string, optional) — Origin Country of Billing Account (required for THIRD_PARTY only)
          - `billing_zip` (string, optional) — Origin Postal Code of Billing Account (required for THIRD_PARTY and RECEIVER)
        - `saturday_delivery` (boolean, optional) — Saturday delivery.
        - `saturday_pickup` (boolean, optional) — Saturday pickup.
        - `hold_for_pickup` (boolean, optional)
        - `hold_for_pickup_options` (object, optional) — Hold for pickup options.
          - `notification_recipient` (object, optional)
            - `phone` (string, optional)
          - `pickup_location` (object, optional)
            - `address1` (string, required) — Line 1 of the address
            - `address2` (string, optional) — Line 2 of the address
            - `address3` (string, optional) — Line 3 of the address
            - `city` (string, required) — City of the address
            - `state` (string, required) — State of the address. Use only the 2 digit code
            - `country` (string, required) — Country of the address. Use only the 2 digit code
            - `postal_code` (string, required) — Postal code of the address
        - `smart_post` (object, optional) — FedEx SmartPost details
          - `hub_id` (integer, optional) — Numeric FedEx SmartPost hub identifier
          - `manifest` (string, optional) — Manifest identifier
        - `endorsement` (string, optional, example: "ADDRESS_CORRECTION") — USPS endorsement type
        - `onerate` (boolean, optional) — FedEx Onerate service option. Can only be used with FedEx services.
      - `tracking_info` (object, optional) — Tracking information
        - `status` (string, optional) — Current status
        - `updated_at` (string, optional) — Last tracking update date/time
        - `estimated_delivery_date` (string, optional) — Estimated delivery date/time
        - `delivery_date` (string, optional) — Delivery date/time
        - `tracking_events` (array, optional) — List of tracking event details
          - `` (array, optional) — List of tracking event details
            - `event_date` (string, optional) — Date and time of tracking event
            - `status` (string, optional) — Status for tracking event
            - `description` (string, optional) — Description of tracking event
            - `city` (string, optional) — Location city of tracking event
            - `state` (string, optional) — Location state of tracking event
            - `postal_code` (string, optional) — Location postal code of tracking event
            - `country` (string, optional) — Location country of tracking event
      - `rate_calc_type` (string, optional) — Rate calculation type
  - `status` (string, optional) — Shipment status
  - `shipping_service` (object, optional) — Service's rate for this shipment
    - `service` (string, optional) — Service name
    - `service_id` (integer, optional) — Service unique identifier
    - `service_code` (string, optional) — Service code
    - `carrier_code` (string, optional) — Carrier code
    - `rate` (number, optional) — Service rate
    - `meter_rate` (number, optional) — Service meter rate
    - `delivery_days` (integer, optional) — Delivery days
    - `delivery_date` (string, optional) — Delivery date
    - `delivery_guaranteed` (boolean, optional) — Is a delivery guaranteed?
  - `tracking_number` (string, optional) — Tracking number
  - `shipped_at` (string, optional) — Date/Time shipment marked as shipped
  - `created_at` (string, optional) — Created date
  - `updated_at` (string, optional) — Updated date
  - `label_text1` (string, optional) — Label Text 1
  - `label_text2` (string, optional) — Label Text 2
  - `price_group` (string, optional) — Price Group/Zone
  - `payment` (object, optional) — Credit Card payment information
    - `amount` (number, optional) — Amount charged to card
    - `currency` (string, optional) — Currency of amount
    - `payment_method_id` (string, optional) — ID of payment method, populates only when used for realtime payment

**Response Example**

```json
{
  "shipment": {
    "id": 0,
    "external_id": "string",
    "order_id": "string",
    "account_reference": "string",
    "batch_id": 0,
    "pickup_id": 0,
    "to_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "from_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "return_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "parcels": [
      [
        0
      ]
    ],
    "status": "string",
    "shipping_service": {
      "service": "string",
      "service_id": 0,
      "service_code": "string",
      "carrier_code": "string",
      "rate": 0,
      "meter_rate": 0,
      "delivery_days": 0,
      "delivery_date": "string",
      "delivery_guaranteed": false
    },
    "tracking_number": "string",
    "shipped_at": "string",
    "created_at": "string",
    "updated_at": "string",
    "label_text1": "string",
    "label_text2": "string",
    "price_group": "string",
    "payment": {
      "amount": 0,
      "currency": "string",
      "payment_method_id": "string"
    }
  }
}
```

---

## Cancel a Shipment

**Source:** https://docs.ehub.com/shipments/cancel-a-shipment

### Endpoint

`PUT /api/v2/shipments/{id}/cancel`

### Description

This endpoint allows you to cancel a shipment and void the label in eHub’s system. Please note that if the label has been scanned by the carrier, you will still be charged. Additionally, USPS, which operates on a prepay basis, holds funds for 30 days before issuing a refund to verify that the label was not used. If the shipment has already been shipped, you must contact the carrier directly to cancel.

## Response

- If the shipment is successfully canceled, the response will have a status code of 200.
- The shipment resource will be returned with all original fields, but the status field will be updated to cancel_pending.
- These status updates are located in shipment.parcels[i].status and shipment.status.

### Canceling a Production USPS Label

- You can cancel a USPS label in production up until it has been manifested in the USPS system.
- USPS manifests new shipments around 2:00 AM Central Time daily. If you don’t cancel before this time, USPS will reject your cancellation request.
- Shipments with a `ship_date` set to the current day will be automatically manifested. You can specify a `ship_date` up to 14 days in the future to avoid immediate manifesting.

### Canceling a Test USPS Label

- You are not charged when a test USPS label is generated, so canceling a test label is not necessary.
- If you want to test your cancellation functionality, you can try canceling a test label. However, act quickly: USPS will reject cancel requests that aren't sent within a minute of label creation.

### Canceling Other Carrier Labels

- For UPS, FedEx, or other carriers, the shipment will be canceled immediately.
- If the carrier receives the shipment and can verify that the label was used, your account will still be charged.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Cancel a Shipment

**Response Fields**

- `shipment` (object, optional) — Shipment object
  - `id` (integer, optional) — Shipment id
  - `external_id` (string, optional) — Shipment external id
  - `order_id` (string, optional) — Order id
  - `account_reference` (string, optional) — Shipment Account Reference
  - `batch_id` (integer, optional) — Shipment batch id
  - `pickup_id` (integer, optional) — Shipment pickup id
  - `to_location` (object, optional) — Address to ship to
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `from_location` (object, optional) — Address to ship from
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `return_location` (object, optional) — Return address if different than from location
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `parcels` (array, optional) — Parcels included in shipment
    - `` (array, optional) — Parcels included in shipment
      - `id` (integer, optional) — Parcel unique identifier
      - `length` (number, optional) — Parcel length
      - `width` (number, optional) — Parcel width
      - `height` (number, optional) — Parcel height
      - `weight` (number, optional) — Weight of shipment
      - `package_type` (string, optional) — Package Type
      - `created_at` (string, optional) — Parcel created time
      - `updated_at` (string, optional) — Parcel last updated time
      - `external_shipment_id` (string, optional) — External shipment id
      - `tracking_number` (string, optional) — Tracking number
      - `shipping_cost` (number, optional) — Cost of shipment
      - `shipping_cost_details` (array, optional) — Shipping cost details
        - `` (array, optional) — Shipping cost details
          - `cost_type` (string, optional) — Cost type
          - `description` (string, optional) — Description
          - `rate` (number, optional) — Service rate
      - `meter_cost` (number, optional) — Meter cost for shipment
      - `meter_cost_details` (array, optional) — Meter cost details
        - `` (array, optional) — Meter cost details
          - `cost_type` (string, optional) — Cost type
          - `description` (string, optional) — Description
          - `rate` (number, optional) — Service rate
      - `status` (string, optional) — Parcel status
      - `parcel_items` (array, optional) — Parcel's items
        - `` (array, optional) — Parcel's items
          - `id` (integer, optional) — Id of item
          - `item_id` (string, optional) — Item id (secondary)
          - `name` (string, optional) — Name of product
          - `accounting_number` (string, optional) — Accounting system identifier for product
          - `variant_name` (string, optional) — Name of variant (if applicable)
          - `variant_id` (integer, optional) — ID of variant (if applicable)
          - `variant_option1` (string, optional) — Variant option (e.g. large)
          - `variant_option2` (string, optional) — Variant option (e.g. red)
          - `variant_option3` (string, optional) — Variant option (e.g. long)
          - `image_src` (string, optional) — URL of the product image
          - `external_id` (string, optional) — External system id, code, or identifier for item
          - `sku` (string, optional) — SKU
          - `weight` (number, optional) — Weight of product
          - `length` (number, optional) — Length of product
          - `width` (number, optional) — Width of product
          - `height` (number, optional) — Height of product
          - `quantity` (number, optional) — Quantity of product
          - `price` (number, optional) — Price per quantity of product
          - `cost` (number, optional) — Total cost of quantity ordered
          - `country_of_origin` (string, optional) — Country of origin, 2 digit code.
          - `customs_data` (object, optional) — Customs data
            - `content_type` (string, optional, example: "merchandise") — Content type of customs data
            - `no_delivery` (string, optional) — What to do if no delivery
            - `hs_tariff_code` (string, optional) — HS tariff code
            - `value` (number, optional) — Value
            - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
      - `customs_data` (object, optional) — Customs data
        - `content_type` (string, optional, example: "merchandise") — Content type of customs data
        - `no_delivery` (string, optional) — What to do if no delivery
        - `hs_tariff_code` (string, optional) — HS tariff code
        - `value` (number, optional) — Value
        - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
      - `postage_label` (object, optional) — Postage label
        - `id` (integer, optional) — Label unique identifier
        - `dims` (string, optional) — Label dimensions
        - `resolution` (integer, optional) — Label resolution
        - `status` (string, optional) — Postage label status
        - `image_url` (string, optional) — Label image URL
        - `created_at` (string, optional) — Label created time
        - `updated_at` (string, optional) — Label last updated time
        - `base64_image` (string, optional) — base64 encoded image
      - `ship_date` (string, optional) — Ship date
      - `shipped_at` (string, optional) — Date/time parcel marked as shipped
      - `description` (string, optional) — Parcel description
      - `service_options` (object, optional) — Service options
        - `additional_handling` (boolean, optional) — AdditionalHandlingIndicator
        - `incoterms` (string, optional, example: "DDU") — Incoterms
        - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED") — Delivery Confirmation, including signature requirements, for the parcel.
        - `dry_ice` (object, optional) — Information about dry ice contained in the parcel.
          - `weight` (number, optional) — Weight (lbs.) of dry ice.
        - `dangerous_goods` (object, optional) — Dangerous goods declaration. The format of this data may be specific to a provider.
          - `details` (object, optional) — Detailed dangerous goods information.
            - `type` (string, optional, example: "CLASS_9_NEW_LITHIUM_DEVICE") — The format of this data may be specific to a provider.
        - `priority_handling` (string, optional, example: "SERVICE_DEFAULT") — Indicates priority handling. Can be carrier-specific and may incur significant extra charges on the parcel.
        - `alternate_billing` (object, optional) — Bill the charges to someone other than the sender.
          - `billing_type` (string, optional, example: "THIRD_PARTY") — Alternate billing type.
          - `bill_to_account_number` (string, optional) — Bill to account number.
          - `billing_country` (string, optional) — Origin Country of Billing Account (required for THIRD_PARTY only)
          - `billing_zip` (string, optional) — Origin Postal Code of Billing Account (required for THIRD_PARTY and RECEIVER)
        - `saturday_delivery` (boolean, optional) — Saturday delivery.
        - `saturday_pickup` (boolean, optional) — Saturday pickup.
        - `hold_for_pickup` (boolean, optional)
        - `hold_for_pickup_options` (object, optional) — Hold for pickup options.
          - `notification_recipient` (object, optional)
            - `phone` (string, optional)
          - `pickup_location` (object, optional)
            - `address1` (string, required) — Line 1 of the address
            - `address2` (string, optional) — Line 2 of the address
            - `address3` (string, optional) — Line 3 of the address
            - `city` (string, required) — City of the address
            - `state` (string, required) — State of the address. Use only the 2 digit code
            - `country` (string, required) — Country of the address. Use only the 2 digit code
            - `postal_code` (string, required) — Postal code of the address
        - `smart_post` (object, optional) — FedEx SmartPost details
          - `hub_id` (integer, optional) — Numeric FedEx SmartPost hub identifier
          - `manifest` (string, optional) — Manifest identifier
        - `endorsement` (string, optional, example: "ADDRESS_CORRECTION") — USPS endorsement type
        - `onerate` (boolean, optional) — FedEx Onerate service option. Can only be used with FedEx services.
      - `tracking_info` (object, optional) — Tracking information
        - `status` (string, optional) — Current status
        - `updated_at` (string, optional) — Last tracking update date/time
        - `estimated_delivery_date` (string, optional) — Estimated delivery date/time
        - `delivery_date` (string, optional) — Delivery date/time
        - `tracking_events` (array, optional) — List of tracking event details
          - `` (array, optional) — List of tracking event details
            - `event_date` (string, optional) — Date and time of tracking event
            - `status` (string, optional) — Status for tracking event
            - `description` (string, optional) — Description of tracking event
            - `city` (string, optional) — Location city of tracking event
            - `state` (string, optional) — Location state of tracking event
            - `postal_code` (string, optional) — Location postal code of tracking event
            - `country` (string, optional) — Location country of tracking event
      - `rate_calc_type` (string, optional) — Rate calculation type
  - `status` (string, optional) — Shipment status
  - `shipping_service` (object, optional) — Service's rate for this shipment
    - `service` (string, optional) — Service name
    - `service_id` (integer, optional) — Service unique identifier
    - `service_code` (string, optional) — Service code
    - `carrier_code` (string, optional) — Carrier code
    - `rate` (number, optional) — Service rate
    - `meter_rate` (number, optional) — Service meter rate
    - `delivery_days` (integer, optional) — Delivery days
    - `delivery_date` (string, optional) — Delivery date
    - `delivery_guaranteed` (boolean, optional) — Is a delivery guaranteed?
  - `tracking_number` (string, optional) — Tracking number
  - `shipped_at` (string, optional) — Date/Time shipment marked as shipped
  - `created_at` (string, optional) — Created date
  - `updated_at` (string, optional) — Updated date
  - `label_text1` (string, optional) — Label Text 1
  - `label_text2` (string, optional) — Label Text 2
  - `price_group` (string, optional) — Price Group/Zone
- `payment` (object, optional) — Shipment payment
  - `currency` (string, optional) — Currency of amount (default = USD)
  - `amount` (number, optional) — Amount to capture (default = 0)
  - `amount_includes_shipping` (boolean, optional) — Amount includes shipping
  - `payment_method_id` (integer, optional) — Primary identifier for saved payment method.  Used in place of credit card info.  Not used if not defined.
  - `payment_transaction_id` (integer, optional) — Ehub Payment Transaction ID.

**Response Example**

```json
{
  "shipment": {
    "id": 0,
    "external_id": "string",
    "order_id": "string",
    "account_reference": "string",
    "batch_id": 0,
    "pickup_id": 0,
    "to_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "from_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "return_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "parcels": [
      [
        0
      ]
    ],
    "status": "string",
    "shipping_service": {
      "service": "string",
      "service_id": 0,
      "service_code": "string",
      "carrier_code": "string",
      "rate": 0,
      "meter_rate": 0,
      "delivery_days": 0,
      "delivery_date": "string",
      "delivery_guaranteed": false
    },
    "tracking_number": "string",
    "shipped_at": "string",
    "created_at": "string",
    "updated_at": "string",
    "label_text1": "string",
    "label_text2": "string",
    "price_group": "string"
  },
  "payment": {
    "currency": "string",
    "amount": 0,
    "amount_includes_shipping": false,
    "payment_method_id": 0,
    "payment_transaction_id": 0
  }
}
```

---

## List Shipments

**Source:** https://docs.ehub.com/shipments/list-shipments

### Endpoint

`GET /api/v2/shipments`

### Description

This endpoint allows you to search for a list of shipments using various filters provided in the query parameters.

### Query Parameters

- `carrier_code` (string, optional) — Carrier code
- `service_code` (string, optional) — Service code
- `ship_from_time` (string, optional) — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `ship_to_time` (string, optional) — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `shipment_batch_id` (string, optional) — Shipment Batch ID to search for.
- `page` (integer, optional) — Page offset to fetch. 1 is default.
- `per_page` (integer, optional) — Number of results to return per page. 100 is default.
- `status` (string, optional, example: "all") — Filter shipments based on status. Defaults to all
- `tracking_number` (string, optional) — An array of tracking_numbers for shipments you are looking for.

### Request Body Fields

- `tracking_number` (array, optional) — Tracking Number(s) to search for.

### Request Example

```json
{
  "tracking_number": []
}
```

### Responses

#### Response 1 — `200`

List Shipments

**Response Fields**

- `shipments` (array, optional) — Shipments
  - `` (array, optional) — Shipments
    - `id` (integer, optional) — Shipment id
    - `external_id` (string, optional) — Shipment external id
    - `order_id` (string, optional) — Order id
    - `account_reference` (string, optional) — Shipment Account Reference
    - `batch_id` (integer, optional) — Shipment batch id
    - `pickup_id` (integer, optional) — Shipment pickup id
    - `to_location` (object, optional) — Address to ship to
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `from_location` (object, optional) — Address to ship from
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `return_location` (object, optional) — Return address if different than from location
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `parcels` (array, optional) — Parcels included in shipment
      - `` (array, optional) — Parcels included in shipment
        - `id` (integer, optional) — Parcel unique identifier
        - `length` (number, optional) — Parcel length
        - `width` (number, optional) — Parcel width
        - `height` (number, optional) — Parcel height
        - `weight` (number, optional) — Weight of shipment
        - `package_type` (string, optional) — Package Type
        - `created_at` (string, optional) — Parcel created time
        - `updated_at` (string, optional) — Parcel last updated time
        - `external_shipment_id` (string, optional) — External shipment id
        - `tracking_number` (string, optional) — Tracking number
        - `shipping_cost` (number, optional) — Cost of shipment
        - `shipping_cost_details` (array, optional) — Shipping cost details
          - `` (array, optional) — Shipping cost details
            - `cost_type` (string, optional) — Cost type
            - `description` (string, optional) — Description
            - `rate` (number, optional) — Service rate
        - `meter_cost` (number, optional) — Meter cost for shipment
        - `meter_cost_details` (array, optional) — Meter cost details
          - `` (array, optional) — Meter cost details
            - `cost_type` (string, optional) — Cost type
            - `description` (string, optional) — Description
            - `rate` (number, optional) — Service rate
        - `status` (string, optional) — Parcel status
        - `parcel_items` (array, optional) — Parcel's items
          - `` (array, optional) — Parcel's items
            - `id` (integer, optional) — Id of item
            - `item_id` (string, optional) — Item id (secondary)
            - `name` (string, optional) — Name of product
            - `accounting_number` (string, optional) — Accounting system identifier for product
            - `variant_name` (string, optional) — Name of variant (if applicable)
            - `variant_id` (integer, optional) — ID of variant (if applicable)
            - `variant_option1` (string, optional) — Variant option (e.g. large)
            - `variant_option2` (string, optional) — Variant option (e.g. red)
            - `variant_option3` (string, optional) — Variant option (e.g. long)
            - `image_src` (string, optional) — URL of the product image
            - `external_id` (string, optional) — External system id, code, or identifier for item
            - `sku` (string, optional) — SKU
            - `weight` (number, optional) — Weight of product
            - `length` (number, optional) — Length of product
            - `width` (number, optional) — Width of product
            - `height` (number, optional) — Height of product
            - `quantity` (number, optional) — Quantity of product
            - `price` (number, optional) — Price per quantity of product
            - `cost` (number, optional) — Total cost of quantity ordered
            - `country_of_origin` (string, optional) — Country of origin, 2 digit code.
            - `customs_data` (object, optional) — Customs data
              - `content_type` (string, optional, example: "merchandise") — Content type of customs data
              - `no_delivery` (string, optional) — What to do if no delivery
              - `hs_tariff_code` (string, optional) — HS tariff code
              - `value` (number, optional) — Value
              - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
        - `customs_data` (object, optional) — Customs data
          - `content_type` (string, optional, example: "merchandise") — Content type of customs data
          - `no_delivery` (string, optional) — What to do if no delivery
          - `hs_tariff_code` (string, optional) — HS tariff code
          - `value` (number, optional) — Value
          - `eel_pfc` (string, optional) — Exemption and Exclusion Legend (EEL) or Proof of Filing Citation (PFC)
        - `postage_label` (object, optional) — Postage label
          - `id` (integer, optional) — Label unique identifier
          - `dims` (string, optional) — Label dimensions
          - `resolution` (integer, optional) — Label resolution
          - `status` (string, optional) — Postage label status
          - `image_url` (string, optional) — Label image URL
          - `created_at` (string, optional) — Label created time
          - `updated_at` (string, optional) — Label last updated time
          - `base64_image` (string, optional) — base64 encoded image
        - `ship_date` (string, optional) — Ship date
        - `shipped_at` (string, optional) — Date/time parcel marked as shipped
        - `description` (string, optional) — Parcel description
        - `service_options` (object, optional) — Service options
          - `additional_handling` (boolean, optional) — AdditionalHandlingIndicator
          - `incoterms` (string, optional, example: "DDU") — Incoterms
          - `delivery_confirmation` (string, optional, example: "NO_SIGNATURE_REQUIRED") — Delivery Confirmation, including signature requirements, for the parcel.
          - `dry_ice` (object, optional) — Information about dry ice contained in the parcel.
            - `weight` (number, optional) — Weight (lbs.) of dry ice.
          - `dangerous_goods` (object, optional) — Dangerous goods declaration. The format of this data may be specific to a provider.
            - `details` (object, optional) — Detailed dangerous goods information.
              - `type` (string, optional, example: "CLASS_9_NEW_LITHIUM_DEVICE") — The format of this data may be specific to a provider.
          - `priority_handling` (string, optional, example: "SERVICE_DEFAULT") — Indicates priority handling. Can be carrier-specific and may incur significant extra charges on the parcel.
          - `alternate_billing` (object, optional) — Bill the charges to someone other than the sender.
            - `billing_type` (string, optional, example: "THIRD_PARTY") — Alternate billing type.
            - `bill_to_account_number` (string, optional) — Bill to account number.
            - `billing_country` (string, optional) — Origin Country of Billing Account (required for THIRD_PARTY only)
            - `billing_zip` (string, optional) — Origin Postal Code of Billing Account (required for THIRD_PARTY and RECEIVER)
          - `saturday_delivery` (boolean, optional) — Saturday delivery.
          - `saturday_pickup` (boolean, optional) — Saturday pickup.
          - `hold_for_pickup` (boolean, optional)
          - `hold_for_pickup_options` (object, optional) — Hold for pickup options.
            - `notification_recipient` (object, optional)
              - `phone` (string, optional)
            - `pickup_location` (object, optional)
              - `address1` (string, required) — Line 1 of the address
              - `address2` (string, optional) — Line 2 of the address
              - `address3` (string, optional) — Line 3 of the address
              - `city` (string, required) — City of the address
              - `state` (string, required) — State of the address. Use only the 2 digit code
              - `country` (string, required) — Country of the address. Use only the 2 digit code
              - `postal_code` (string, required) — Postal code of the address
          - `smart_post` (object, optional) — FedEx SmartPost details
            - `hub_id` (integer, optional) — Numeric FedEx SmartPost hub identifier
            - `manifest` (string, optional) — Manifest identifier
          - `endorsement` (string, optional, example: "ADDRESS_CORRECTION") — USPS endorsement type
          - `onerate` (boolean, optional) — FedEx Onerate service option. Can only be used with FedEx services.
        - `tracking_info` (object, optional) — Tracking information
          - `status` (string, optional) — Current status
          - `updated_at` (string, optional) — Last tracking update date/time
          - `estimated_delivery_date` (string, optional) — Estimated delivery date/time
          - `delivery_date` (string, optional) — Delivery date/time
          - `tracking_events` (array, optional) — List of tracking event details
            - `` (array, optional) — List of tracking event details
              - `event_date` (string, optional) — Date and time of tracking event
              - `status` (string, optional) — Status for tracking event
              - `description` (string, optional) — Description of tracking event
              - `city` (string, optional) — Location city of tracking event
              - `state` (string, optional) — Location state of tracking event
              - `postal_code` (string, optional) — Location postal code of tracking event
              - `country` (string, optional) — Location country of tracking event
        - `rate_calc_type` (string, optional) — Rate calculation type
    - `status` (string, optional) — Shipment status
    - `shipping_service` (object, optional) — Service's rate for this shipment
      - `service` (string, optional) — Service name
      - `service_id` (integer, optional) — Service unique identifier
      - `service_code` (string, optional) — Service code
      - `carrier_code` (string, optional) — Carrier code
      - `rate` (number, optional) — Service rate
      - `meter_rate` (number, optional) — Service meter rate
      - `delivery_days` (integer, optional) — Delivery days
      - `delivery_date` (string, optional) — Delivery date
      - `delivery_guaranteed` (boolean, optional) — Is a delivery guaranteed?
    - `tracking_number` (string, optional) — Tracking number
    - `shipped_at` (string, optional) — Date/Time shipment marked as shipped
    - `created_at` (string, optional) — Created date
    - `updated_at` (string, optional) — Updated date
    - `label_text1` (string, optional) — Label Text 1
    - `label_text2` (string, optional) — Label Text 2
    - `price_group` (string, optional) — Price Group/Zone
    - `payment` (object, optional) — Credit Card payment information
      - `amount` (number, optional) — Amount charged to card
      - `currency` (string, optional) — Currency of amount
      - `payment_method_id` (string, optional) — ID of payment method, populates only when used for realtime payment

**Response Example**

```json
{
  "shipments": [
    [
      0
    ]
  ]
}
```

---

## Validate an address

**Source:** https://docs.ehub.com/shipments/validate-an-address

### Endpoint

`GET /api/v2/shipping/validate_address`

### Description

The `has_update` parameter in the response is used to indicate whether the USPS database has additional information or changes to the address you submitted in your shipment request. This can include details such as:

- The last four digits of the postal code.
- An apartment or suite number that may have been missing.

If `has_update` is `true`, it means that USPS has made an adjustment or provided additional information to the address.

### Query Parameters

- `address1` (string, required, example: "220 S State St") — Line 1 of the address.
- `address2` (string, optional) — Line 2 of the address.
- `address3` (string, optional) — Line 3 of the address.
- `city` (string, required, example: "Salt Lake City") — City of the address.
- `state` (string, required, example: "UT") — State of the address. Use only the 2 digit code.
- `country` (string, required, example: "US") — Country of the address. Use only the 2 digit code.
- `postal_code` (string, required, example: "84111") — Postal code of the address.

### Responses

#### Response 1 — `200`

Validate an address

**Response Fields**

- `validate_address` (object, optional) — The address based on validation
  - `is_valid` (boolean, optional) — If the submitted address is a valid address
  - `has_update` (boolean, optional) — If the address in the response has a field that is different from the submitted address
  - `address` (object, optional) — The address based on validation
    - `company` (string, optional) — The company name of the addressee.
    - `first_name` (string, optional) — The first name of the addressee.
    - `last_name` (string, optional) — The last name of the addressee.
    - `nick_name` (string, optional) — The nick name of the address.
    - `address1` (string, required) — Line 1 of the address.
    - `address2` (string, optional) — Line 2 of the address.
    - `address3` (string, optional) — Line 3 of the address.
    - `city` (string, required) — City of the address.
    - `state` (string, required) — State of the address. Use only the 2 digit code.
    - `country` (string, required) — Country of the address. Use only the 2 digit code.
    - `postal_code` (string, required) — Postal code of the address.
    - `phone` (string, optional) — Phone number of the address.
    - `email` (string, optional) — E-mail of the address.
    - `residential` (boolean, optional) — Residential or commercial classification

**Response Example**

```json
{
  "validate_address": {
    "is_valid": false,
    "has_update": false,
    "address": {
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string",
      "residential": false
    }
  }
}
```

---

## Create Tracking Events for a Shipment

**Source:** https://docs.ehub.com/shipments/create-tracking-events-for-a-shipment

### Endpoint

`POST /api/v2/shipments/{id}/tracking_events`

### Description

GDE (Global Direct Entry) shipments can often experience delays between the time a label is created and when the package is officially inducted into the USPS postal stream. This delay can occur due to various reasons such as processing times, transportation, or customs handling. During this period, there may be little to no tracking updates available, which can leave customers uncertain about the status of their shipment.

To help keep your customers informed, this endpoint allows you to create custom tracking events for shipments that may experience long periods between label creation and being inducted into the USPS postal stream. These tracking events can simulate package movement to provide updates to your customers.

### **Supported USPS Tracking Codes**

Only tracking events for the following USPS tracking codes are supported:

- **80**: Pre-shipment information sent to USPS
- **81**: Package arrived at USPS facility
- **82**: Package departed USPS facility

### **Endpoint Overview**

This endpoint allows you to create tracking events for **one shipment at a time**.

### Path Parameters

- `id` (integer, required)

### Request Body Fields

- `code` (Number, required, example: 80) — Event code
- `secondary_code` (Number, optional) — Secondary Code
- `description` (string, optional, example: "Package enroute to shipping provider") — Description
- `event_timestamp` (string, required, example: "2024-09-06 12:25:39") — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `city` (string, optional, example: "Los Angeles") — City
- `state` (string, optional, example: "CA") — State
- `postal_code` (string, optional, example: "90020") — Postal Code
- `country` (string, optional, example: "US") — Country

### Request Example

```json
{
  "code": 80,
  "secondary_code": null,
  "description": "Package enroute to shipping provider",
  "event_timestamp": "2024-09-06 12:25:39",
  "city": "Los Angeles",
  "state": "CA",
  "postal_code": "90020",
  "country": "US"
}
```

### Responses

#### Response 1 — `201`

Create Tracking Events for a Shipment

**Response Fields**

- `status` (string, optional) — Save status

**Response Example**

```json
{
  "status": "string"
}
```

---

## Create Tracking Events for Multiple Shipments

**Source:** https://docs.ehub.com/shipments/create-tracking-events-for-multiple-shipments

### Endpoint

`POST /api/v2/tracking_events`

### Description

This endpoint allows you to create tracking events for **multiple GDE shipments** in a single call, helping keep your customers informed when there are long periods between label creation and the shipment's induction into the USPS postal stream.

---

### **Supported USPS Tracking Codes**

The following USPS tracking codes are supported for creating tracking events:

- **80**: Pre-shipment information sent to USPS.
- **81**: Package arrived at USPS facility.
- **82**: Package departed USPS facility.

---

### **Endpoint Overview**

This endpoint can handle multiple shipments in a single call.

### Request Body Fields

- `shipment_ids` (array, optional) — Shipment ids contained in the Pickup
- `code` (Number, required, example: 80) — Event code
- `secondary_code` (Number, optional) — Secondary Code
- `description` (string, optional, example: "Package enroute to provider") — Description
- `event_timestamp` (string, required, example: "2024-09-06 12:25:39") — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `city` (string, optional, example: "Los Angeles") — City
- `state` (string, optional, example: "CA") — State
- `postal_code` (string, optional, example: "90020") — Postal Code
- `country` (string, optional, example: "US") — Country

### Request Example

```json
{
  "shipment_ids": [],
  "code": 80,
  "secondary_code": null,
  "description": "Package enroute to provider",
  "event_timestamp": "2024-09-06 12:25:39",
  "city": "Los Angeles",
  "state": "CA",
  "postal_code": "90020",
  "country": "US"
}
```

### Responses

#### Response 1 — `201`

Create Tracking Events for Shipments

**Response Fields**

- `status` (string, optional) — Save status

**Response Example**

```json
{
  "status": "string"
}
```

---

## Batches and Manifests

**Source:** https://docs.ehub.com/batches-and-manifests

### Description

eHub's API offers powerful tools for managing and organizing shipment batches, allowing users to streamline end-of-day processes, manifest shipments, and ensure that all packages are ready for carrier pickup. Below is a high-level summary of the available features:

---

### 1. **List Shipment Batches**

With this endpoint, users can access a comprehensive list of **previously created batches**. This feature enables tracking and reviewing past shipment batches, ensuring that records are easily accessible for auditing or management purposes.

### 2. **Create a Shipments Batch**

To manifest shipments, this endpoint allows customers to create a new batch, grouping together all shipments they want processed. By generating a batch, all related shipments are documented and prepared for pickup by the designated carriers.

### 3. **Create Batches for a Specific Date**

This endpoint lets users create batches specifically for shipments scheduled on a particular date. It automatically includes all unmanifested shipments connected to the eHub account for that date, simplifying the batch creation process for time-sensitive deliveries.

### 4. **Retrieve a Batch**

If users need to view details of a previously created batch, this endpoint allows for easy retrieval of a batch's information. Whether for verification, troubleshooting, or record-keeping, retrieving a batch ensures transparency and accessibility of shipment data.

---

## List Shipment Batches

**Source:** https://docs.ehub.com/batches-and-manifests/list-shipment-batches

### Endpoint

`GET /api/v2/shipments/batches`

### Description

When customers are ready to close out their day or generate a manifest for their shipments, they will need to create a batch that includes all the shipments they want manifested.

This ensures that all shipments are correctly documented and ready for carrier pickup.

This endpoint provides a list of the **previously created batches**, allowing customers to easily track and review past batch manifests.

### Query Parameters

- `date_from` (string, required) — Date format YYYY-MM-DD or DD-MM-YYYY
- `date_to` (string, required) — Date format YYYY-MM-DD or DD-MM-YYYY
- `page` (integer, optional) — Number of results to return per page. 1 is default.
- `per_page` (integer, optional) — Page offset to fetch. 100 is default.

### Responses

#### Response 1 — `200`

Shipments Batches

**Response Fields**

- `shipments_batches` (array, optional) — Shipments batches
  - `` (array, optional) — Shipments batches
    - `id` (string, optional) — Batch unique identifier
    - `bol_url` (string, optional) — Bill of Lading url
    - `created_at` (string, optional) — Created date
    - `shipments_ids` (array, optional) — Closed shipments IDs
      - `` (array, optional) — Closed shipments IDs
    - `tracking_number` (string, optional) — Manifest Tracking Number
    - `errors` (string, optional) — Errors

**Response Example**

```json
{
  "shipments_batches": [
    [
      "string"
    ]
  ]
}
```

---

## Create a Shipments Batch

**Source:** https://docs.ehub.com/batches-and-manifests/create-a-shipments-batch

### Endpoint

`POST /api/v2/shipments/batches`

### Description

Use this endpoint to generate a daily manifest or scan form. Note that some carriers may have up to a 15-minute delay in generating the physical file. If a PDF isn’t returned in the response but the request was successful, wait a few minutes and try a GET request again. Ensure you only include `shipment_ids` for a single carrier at a time.

### Supported Carriers

- **USPS**
- **DHL eCommerce**

### Unsupported Carriers

- **UPS**
  - UPS has a concept of manifesting that is mainly done through UPS World Ship. However, PC postage providers like EasyPost don't support it, and therefore neither do we.

- **FedEx**
  - FedEx doesn't have a concept of manifesting.


## Carrier-Specific Notes

### DHL

- Most carriers will return the manifest instantly, however DHL has an expected manifest creation time of 2-15 minutes.
- Due to limitations imposed by DHL, clients needing to retrieve or handle the DHL manifest returned from a manifest creation request (batch) should wait at least 1-2 minutes before performing a GET `/api/v2/shipments/batches/{shipments_batch_id}` request.
  - This will provide the AWS S3 URL located in the `"bol_url"` field. You can then make a subsequent HTTP GET request to the AWS S3 URL to retrieve the file.

- **For domestic and international shipments:**
  - Manifests will be split into separate documents.
  - Example: For 115 shipments, with 41 domestic and 74 international, you will receive two documents, one for the 41 domestic shipments and another for the 74 international shipments.


### **USPS**

- USPS will automatically manifest or close out all shipments for a customer at the end of the day, usually around 2:00 AM Central Time.
- Attempting to manifest a package that has been manifested by USPS from this automatic closeout process will result in an error.
- If you need to provide a manifest document to the driver at pick-up, you must create a same-day manifest before USPS automatically closes it out. This document is also known as a Scan Form.

### Request Body Fields

- `shipments_ids` (array, required) — Shipments IDs
- `include_merged` (boolean, optional) — Merge ScanForms into one PDF?

### Request Example

```json
{
  "shipments_ids": [],
  "include_merged": false
}
```

### Responses

#### Response 1 — `201`

Create a Shipments Batch

**Response Fields**

- `shipments_batches` (array, optional) — Shipments batches
  - `` (array, optional) — Shipments batches
    - `id` (string, optional) — Batch unique identifier
    - `bol_url` (string, optional) — Bill of Lading url
    - `created_at` (string, optional) — Created date
    - `shipments_ids` (array, optional) — Closed shipments IDs
      - `` (array, optional) — Closed shipments IDs
    - `tracking_number` (string, optional) — Manifest Tracking Number
    - `errors` (string, optional) — Error messages
- `merged_docs` (string, optional) — Merged PDF

**Response Example**

```json
{
  "shipments_batches": [
    [
      "string"
    ]
  ],
  "merged_docs": "string"
}
```

---

## Create Batches for a Specific Date

**Source:** https://docs.ehub.com/batches-and-manifests/create-batches-for-a-specific-date

### Endpoint

`POST /api/v2/shipments/batches/daily`

### Description

This endpoint allows you to create a separate batch for each shipping service provider that supports daily batches. It automatically includes all shipments associated with your eHub account for the specified date that have not yet been manifested.

### Key Features:

- **Automated Batching**: All unmanifested shipments linked to your eHub account for the specified date are automatically included in the batch.
- **Multi-Provider Support**: Creates a batch for each shipping service provider that supports daily batching, optimizing shipment processing across different carriers.

This endpoint streamlines shipment manifesting by ensuring that all eligible shipments are processed efficiently with their respective carriers.

### Request Body Fields

- `shipment_date` (string, required) — Date of shipments to include in batch. Date format YYYY-MM-DD or DD-MM-YYYY

### Request Example

```json
{
  "shipment_date": "string"
}
```

### Responses

#### Response 1 — `201`

Create Batches for a Specific Date

**Response Fields**

- `shipments_batches` (array, optional) — Shipments batches
  - `` (array, optional) — Shipments batches
    - `id` (string, optional) — Batch unique identifier
    - `bol_url` (string, optional) — Bill of Lading url
    - `created_at` (string, optional) — Created date
    - `shipments_ids` (array, optional) — Closed shipments IDs
      - `` (array, optional) — Closed shipments IDs
    - `tracking_number` (string, optional) — Manifest Tracking Number
    - `errors` (string, optional) — Error messages

**Response Example**

```json
{
  "shipments_batches": [
    [
      "string"
    ]
  ]
}
```

---

## Retrieve a Batch

**Source:** https://docs.ehub.com/batches-and-manifests/retrieve-a-batch

### Endpoint

`GET /api/v2/shipments/batches/{id}`

### Description

## Manifest Image Retrieval

Manifest images for your shipments are stored in a public AWS S3 bucket and can be accessed via a simple GET HTTP request using the `bol_url` parameter, which provides the full URL to the stored image.

#### Key Points:

- **Public Access**: No authentication is required to retrieve the manifest image since it's stored in a public AWS S3 bucket.
- **Delayed Availability**: If you're retrieving a DHL Batch and the `bol_url` parameter isn't available, wait 2–15 minutes and try again. If it still doesn't appear, contact support at support@ehub.com.

This process ensures easy and secure retrieval of your manifest images from the cloud.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Retrieve a Batch

**Response Fields**

- `id` (string, optional) — Batch unique identifier
- `bol_url` (string, optional) — Bill of Lading url
- `created_at` (string, optional) — Created date
- `shipments_ids` (array, optional) — Closed shipments IDs
  - `` (array, optional) — Closed shipments IDs
- `tracking_number` (string, optional) — Manifest Tracking Number
- `errors` (string, optional) — Errors

**Response Example**

```json
{
  "id": "string",
  "bol_url": "string",
  "created_at": "string",
  "shipments_ids": [
    []
  ],
  "tracking_number": "string",
  "errors": "string"
}
```

---

## Pickups

**Source:** https://docs.ehub.com/pickups

### Description

The **Pickups** API endpoints allow users to manage the scheduling, retrieval, and cancellation of **USPS** pickups within the eHub system. These endpoints provide a seamless way to request and manage pickups for shipments, ensuring timely and efficient delivery processes. Whether you're scheduling a USPS pickup or checking availability, these endpoints cover the entire lifecycle of a pickup request.

---

## **Pickup Management Endpoints**

The following endpoints enable users to create, retrieve, and cancel pickups, providing control over the logistics of moving shipments:

- **Retrieve a List of Pickups**:
Retrieve a list of all scheduled pickups, including details like location, shipment IDs, and pickup status.
- **Check Pickup Availability for a Location**:
Check whether pickups are available at a specific location by providing address details. This ensures that a pickup can be scheduled at the desired location.
- **Request a New Pickup:**
Schedule a new USPS pickup for your shipments. This endpoint allows you to provide the pickup location, requested time, and shipment details.
- **Retrieve a Scheduled Pickup**:
Retrieve detailed information about a specific scheduled pickup, including location, requested time, shipment IDs, and instructions.
- **Cancel a Pickup**:
Cancel a previously scheduled pickup by providing the pickup ID. This ensures that unnecessary or incorrect pickups are canceled promptly.

---

## List Pickups

**Source:** https://docs.ehub.com/pickups/list-pickups

### Endpoint

`GET /api/v2/pickups`

### Description

This API endpoint allows users to retrieve a list of all scheduled pickups. The data returned includes relevant details such as pickup locations, requested times, and associated shipment IDs.

### Query Parameters

- `pickup_date_start` (string, optional) — Date format YYYY-MM-DD or DD-MM-YYYY
- `pickup_date_end` (string, optional) — Date format YYYY-MM-DD or DD-MM-YYYY
- `status` (integer, optional, example: "requested") — Page offset to fetch.Default = requested
- `page` (integer, optional) — Page offset to fetch. Default = 1
- `per_page` (integer, optional) — Number of results to return per page. Default = 100

### Responses

#### Response 1 — `200`

List Pickups

**Response Fields**

- `pickups` (array, optional) — Pickups
  - `` (array, optional) — Pickups
    - `id` (integer, optional) — Pickup id
    - `location` (object, optional) — Location of pickup
      - `external_id` (string, optional) — Address external id
      - `company` (string, optional) — The company of the addressee
      - `first_name` (string, optional) — The first name of the addressee
      - `last_name` (string, optional) — The last name of the addressee
      - `nick_name` (string, optional) — The nick name of the address
      - `address1` (string, required) — Line 1 of the address
      - `address2` (string, optional) — Line 2 of the address
      - `address3` (string, optional) — Line 3 of the address
      - `city` (string, required) — City of the address
      - `state` (string, required) — State of the address. Use only the 2 digit code
      - `country` (string, required) — Country of the address. Use only the 2 digit code
      - `postal_code` (string, required) — Postal code of the address
      - `phone` (string, optional) — Phone of the address
      - `email` (string, optional) — E-mail of the address
    - `pickup_date` (string, optional) — Date of pickup
    - `status` (string, optional, example: "REQUESTED") — Pickup status
    - `shipment_ids` (array, optional) — Shipment ids contained in the Pickup
      - `` (array, optional) — Shipment ids contained in the Pickup
    - `shipment_batch_ids` (array, optional) — Shipment batch ids contained in the Pickup
      - `` (array, optional) — Shipment batch ids contained in the Pickup
    - `external_id` (string, optional) — Provider-specific Pickup identifier
    - `location_detail` (string, optional, example: "Front Door") — Location of packages
    - `special_instructions` (string, optional) — Special instructions for carrier

**Response Example**

```json
{
  "pickups": [
    [
      0
    ]
  ]
}
```

---

## Check Pickup Availability for Location

**Source:** https://docs.ehub.com/pickups/check-pickup-availability-for-location

### Endpoint

`POST /api/v2/pickups/availability`

### Description

This API endpoint allows users to check whether pickups are available at a specific location. The request requires the location details such as address, city, state, and postal code. This is useful for verifying whether a pickup can be scheduled at a given address.

### Request Body Fields

- `location` (object, required) — Location of pickup
  - `company` (string, optional) — The company of the addressee
  - `first_name` (string, optional) — The first name of the addressee
  - `last_name` (string, optional) — The last name of the addressee
  - `address1` (string, required) — Line 1 of the address
  - `address2` (string, optional) — Line 2 of the address
  - `address3` (string, optional) — Line 3 of the address
  - `city` (string, required) — City of the address
  - `state` (string, required) — State of the address. Use only the 2 digit code
  - `country` (string, required) — Country of the address. Use only the 2 digit code
  - `postal_code` (string, required) — Postal code of the address
- `pickup_date` (string, required) — Date of pickup

### Request Example

```json
{
  "location": {
    "company": "string",
    "first_name": "string",
    "last_name": "string",
    "address1": "string",
    "address2": "string",
    "address3": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string"
  },
  "pickup_date": "string"
}
```

### Responses

#### Response 1 — `201`

Check Pickup Availability for Location

**Response Fields**

- `available` (boolean, optional) — Pickup availability
- `reason` (string, optional) — Reason pickup is unavailable
- `location` (object, optional) — Location of pickup
  - `external_id` (string, optional) — Address external id
  - `company` (string, optional) — The company of the addressee
  - `first_name` (string, optional) — The first name of the addressee
  - `last_name` (string, optional) — The last name of the addressee
  - `nick_name` (string, optional) — The nick name of the address
  - `address1` (string, required) — Line 1 of the address
  - `address2` (string, optional) — Line 2 of the address
  - `address3` (string, optional) — Line 3 of the address
  - `city` (string, required) — City of the address
  - `state` (string, required) — State of the address. Use only the 2 digit code
  - `country` (string, required) — Country of the address. Use only the 2 digit code
  - `postal_code` (string, required) — Postal code of the address
  - `phone` (string, optional) — Phone of the address
  - `email` (string, optional) — E-mail of the address
- `pickup_date` (string, optional) — Date of pickup

**Response Example**

```json
{
  "available": false,
  "reason": "string",
  "location": {
    "external_id": "string",
    "company": "string",
    "first_name": "string",
    "last_name": "string",
    "nick_name": "string",
    "address1": "string",
    "address2": "string",
    "address3": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postal_code": "string",
    "phone": "string",
    "email": "string"
  },
  "pickup_date": "string"
}
```

---

## Request a New Pickup

**Source:** https://docs.ehub.com/pickups/request-a-new-pickup

### Endpoint

`POST /api/v2/pickups`

### Description

This API endpoint allows users to schedule a new USPS pickup. You can specify details such as the pickup location, shipment IDs, and the requested pickup time.

**This endpoint is specifically designed for USPS pickups only.**

### Request Body Fields

- `pickup` (object, optional) — Pickup details
  - `location` (object, optional) — Location of pickup
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
  - `pickup_date` (string, optional) — Date of pickup
  - `shipment_ids` (array, optional) — Shipment ids contained in the Pickup
    - `0` (number, optional, example: 123)
    - `1` (number, optional, example: 456)
    - `2` (number, optional, example: 789)
  - `create_batch` (boolean, optional, example: false) — Create a Shipment Batch from the shipment_ids before creating a Pickup
  - `shipment_batch_ids` (array, optional) — Shipment batch ids contained in the Pickup
    - `0` (number, optional, example: 8675)
    - `1` (number, optional, example: 309)
  - `location_detail` (string, optional) — Location of packages, e.g. 'front door'
  - `special_instructions` (string, optional) — Special instructions for carrier

### Request Example

```json
{
  "pickup": {
    "location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string"
    },
    "pickup_date": "string",
    "shipment_ids": [
      123
    ],
    "create_batch": false,
    "shipment_batch_ids": [
      8675
    ],
    "location_detail": "string",
    "special_instructions": "string"
  }
}
```

### Responses

#### Response 1 — `201`

Request a New Pickup

**Response Fields**

- `pickup` (object, optional) — Pickup details
  - `id` (integer, optional) — Pickup id
  - `location` (object, optional) — Location of pickup
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `pickup_date` (string, optional) — Date of pickup
  - `status` (string, optional, example: "REQUESTED") — Pickup status
  - `shipment_ids` (array, optional) — Shipment ids contained in the Pickup
    - `` (array, optional) — Shipment ids contained in the Pickup
  - `shipment_batch_ids` (array, optional) — Shipment batch ids contained in the Pickup
    - `` (array, optional) — Shipment batch ids contained in the Pickup
  - `external_id` (string, optional) — Provider-specific Pickup identifier
  - `location_detail` (string, optional, example: "Front Door") — Location of packages
  - `special_instructions` (string, optional) — Special instructions for carrier

**Response Example**

```json
{
  "pickup": {
    "id": 0,
    "location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "pickup_date": "string",
    "status": "REQUESTED",
    "shipment_ids": [
      []
    ],
    "shipment_batch_ids": [
      []
    ],
    "external_id": "string",
    "location_detail": "Front Door",
    "special_instructions": "string"
  }
}
```

---

## Retrieve a Scheduled Pickup

**Source:** https://docs.ehub.com/pickups/retrieve-a-scheduled-pickup

### Endpoint

`GET /api/v2/pickups/{id}`

### Description

This API endpoint allows users to retrieve detailed information about a previously scheduled pickup. The information returned includes pickup location, shipment IDs, requested times, and any special instructions.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Retrieve a Scheduled Pickup

**Response Fields**

- `pickup` (object, optional) — Pickup details
  - `id` (integer, optional) — Pickup id
  - `location` (object, optional) — Location of pickup
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `pickup_date` (string, optional) — Date of pickup
  - `status` (string, optional, example: "REQUESTED") — Pickup status
  - `shipment_ids` (array, optional) — Shipment ids contained in the Pickup
    - `` (array, optional) — Shipment ids contained in the Pickup
  - `shipment_batch_ids` (array, optional) — Shipment batch ids contained in the Pickup
    - `` (array, optional) — Shipment batch ids contained in the Pickup
  - `external_id` (string, optional) — Provider-specific Pickup identifier
  - `location_detail` (string, optional, example: "Front Door") — Location of packages
  - `special_instructions` (string, optional) — Special instructions for carrier

**Response Example**

```json
{
  "pickup": {
    "id": 0,
    "location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "pickup_date": "string",
    "status": "REQUESTED",
    "shipment_ids": [
      []
    ],
    "shipment_batch_ids": [
      []
    ],
    "external_id": "string",
    "location_detail": "Front Door",
    "special_instructions": "string"
  }
}
```

---

## Cancel a Pickup

**Source:** https://docs.ehub.com/pickups/cancel-a-pickup

### Endpoint

`DELETE /api/v2/pickups/{id}`

### Description

This API endpoint allows users to cancel a previously scheduled pickup. You must provide the pickup ID to identify the pickup to be canceled.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Cancel a Pickup

**Response Fields**

- `pickup` (object, optional) — Pickup details
  - `id` (integer, optional) — Pickup id
  - `location` (object, optional) — Location of pickup
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `pickup_date` (string, optional) — Date of pickup
  - `status` (string, optional, example: "REQUESTED") — Pickup status
  - `shipment_ids` (array, optional) — Shipment ids contained in the Pickup
    - `` (array, optional) — Shipment ids contained in the Pickup
  - `shipment_batch_ids` (array, optional) — Shipment batch ids contained in the Pickup
    - `` (array, optional) — Shipment batch ids contained in the Pickup
  - `external_id` (string, optional) — Provider-specific Pickup identifier
  - `location_detail` (string, optional, example: "Front Door") — Location of packages
  - `special_instructions` (string, optional) — Special instructions for carrier

**Response Example**

```json
{
  "pickup": {
    "id": 0,
    "location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "pickup_date": "string",
    "status": "REQUESTED",
    "shipment_ids": [
      []
    ],
    "shipment_batch_ids": [
      []
    ],
    "external_id": "string",
    "location_detail": "Front Door",
    "special_instructions": "string"
  }
}
```

---

## Order Stores

**Source:** https://docs.ehub.com/order-stores

### Description

eHub empowers users to connect a wide range of eCommerce services, which we refer to as **Order Stores**. These connections allow customers to seamlessly consolidate and manage orders through a Transportation Management System (TMS). Below is a summary of how Order Stores work and the endpoints available for managing orders within eHub's system.

## Order Store Integration

eHub provides the functionality to **pull orders and related information** from connected eCommerce systems, as well as **update shipment details** back into those systems. This ensures a streamlined order management process from creation to shipping.

To view existing Order Stores or to add a new one, users can follow these steps:

- Log into eHub → Select **`API`** on the far left menu → Click on **`Settings`** in the API submenu → Click on **`Stores`**

## Adding New Order Stores

On the **New Order Store** page, users can select the type of store they want to connect. The page will guide them through the connection process, which varies by store type—some use OAuth 2.0, while others require keys, URLs, or tokens. The page also shows a table listing the **available functionality** for each store type, as not all stores support full eHub functionality. Clicking **Save** will save the store

- If OAuth 2.0 is required, users will need to **Authorize** the connection.
- After completing the connection, users can begin interacting with their order stores.

It is not possible to successfully interact with the Order endpoints without first specifying the Order Store in the request URL. Therefore we have the List Order Stores endpoint to retrieve all the store connections you have created through your eHub account and their IDs. You will specify the store ID in your request URL.

## eHub Order Store Endpoints

To interact with Order Stores, you need to retrieve their details using the **List Order Stores** endpoint, which shows all connected stores and their unique IDs. These IDs will be used in requests to perform actions on specific stores. Below are the key endpoints available:

**Endpoint****Purpose**List Order StoresShows an array of order stores connected to your eHub accountList Orders From an Order StoreShows an array of orders for a specific storeRetrieve an Order From an Order StoreShows a single order for a specific storeShip an OrderAdd shipment information to an order in the order store's eCommerce systemCancel and Order's ShipmentOverride or delete shipment information on an order in the store's eCommerce systemCreate Custom OrdersAssociated with “Custom” order stores which are explained belowUpdate a Custom OrderAssociated with “Custom” order stores which are explained below

## Custom Orders and Order Stores

eHub supports **Custom Order Stores**, which are useful for integrating custom software platforms with eHub’s Order Store API. This allows for the storage and management of custom order data that can be accessed by partner software, such as eHub Ship. Custom Order Stores must be created in the eHub portal before using their associated endpoints.

---

## List Order Stores

**Source:** https://docs.ehub.com/order-stores/list-order-stores

### Endpoint

`GET /api/v2/order_stores`

### Description

This endpoint will return a list of all the eCommerce stores connected to your eHub account, allowing you to manage and interact with them.

### Responses

#### Response 1 — `200`

List Order Stores

**Response Fields**

- `order_stores` (array, optional) — List of order stores
  - `` (array, optional) — List of order stores
    - `id` (integer, optional) — Order store id
    - `name` (string, optional) — Order store name
    - `external_id` (string, optional) — Order store external unique identifier
    - `service_type` (string, optional) — Order store type
    - `created_at` (string, optional) — Order store created time
    - `updated_at` (string, optional) — Order store last updated time

**Response Example**

```json
{
  "order_stores": [
    [
      0
    ]
  ]
}
```

---

## List Orders From an Order Store

**Source:** https://docs.ehub.com/order-stores/list-orders-from-an-order-store

### Endpoint

`GET /api/v2/order_stores/{order_store_id}/orders`

### Description

To retrieve a list of orders for a specific **Order Store**, you can use the following endpoint. The **status filter** helps narrow down the results based on the order's shipment status.

This endpoint will return a list of orders for a specific order store connected to your eHub account. You can filter the orders based on their shipment status.

### Path Parameters

- `order_store_id` (integer, required)

### Query Parameters

- `page` (integer, optional) — Page offset to fetch.
- `per_page` (integer, optional) — Number of results to return per page.
- `status` (string, optional, example: "pending") — Filter orders based on shipment_status. Defaults to pending

### Responses

#### Response 1 — `200`

List Orders From an Order Store

**Response Fields**

- `orders` (array, optional) — List of orders with any associated shipments
  - `0` (object, optional)
    - `id` (number, optional, example: 1631844)
    - `order_store_type` (string, optional, example: "custom")
    - `order_store_id` (number, optional, example: 1245154)
    - `order_store_name` (string, optional, example: "your_store_name")
    - `order_id` (number, optional, example: 1631844) — The eCommerce system's designated order id
    - `external_id` (string, optional)
    - `order_number` (string, optional, example: "UA111111") — The eCommerce system's user friendly order id
    - `sub_order_count` (string, optional)
    - `order_date` (string, optional, example: "2024-08-28T21:00:33.000Z") — Date the order was placed
    - `payment_status` (string, optional, example: "unpaid")
    - `order_status` (string, optional, example: "active")
    - `shipment_status` (string, optional, example: "pending")
    - `items_total` (string, optional, example: "150.0") — The total cost of all items on the order
    - `tax_total` (string, optional) — The total tax amount for the order
    - `total` (string, optional, example: "150.0") — items_total + tax_total + shipping_total
    - `shipping_total` (string, optional) — The amount your system charged the end customer for shipping
    - `notes` (string, optional, example: "Provided note by partner software.")
    - `tags` (string, optional, example: "tag1, tag2, tag3") — Tags allow you to add specific indicators to orders. They can indicate which warehouse should fulfill the order, or if some special work is needed to process the order.
    - `items` (array, optional)
      - `0` (object, optional)
        - `id` (number, optional, example: 42623515)
        - `item_id` (string, optional, example: "22222")
        - `name` (string, optional, example: "Test Item Name Updated")
        - `accounting_id` (string, optional, example: "string")
        - `accounting_number` (string, optional, example: "string")
        - `variant_name` (string, optional, example: "Blue / Large / New")
        - `variant_id` (string, optional) — Your system's id for the product's variant
        - `variant_option1` (string, optional)
        - `variant_option2` (string, optional)
        - `variant_option3` (string, optional)
        - `image_src` (string, optional)
        - `external_id` (string, optional, example: "22222")
        - `sku` (string, optional, example: "TEST-BLUE-L-NEW")
        - `alt_external_id` (string, optional, example: "TEST-BLUE-L-NEW")
        - `weight` (number, optional, example: 4) — In ounces
        - `length` (string, optional)
        - `width` (string, optional)
        - `height` (string, optional)
        - `quantity` (string, optional, example: "2.0") — How many were ordered
        - `price` (string, optional, example: "75.0") — The price of a single item
        - `cost` (string, optional, example: "150.0") — price * quantity
    - `billing_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "900 W Olympic Blvd")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90015")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_billing_email@test.com")
    - `shipping_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "1150 S Beverly Dr")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90035")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_shipping_email@test.com")
    - `external_customer_email` (string, optional, example: "test_customer_email@test.com")
    - `external_customer_id` (string, optional, example: "HIJKMNL2515") — The id for the customer in the eCommerce system
    - `shipping_method` (string, optional, example: "Expedited") — The shipping method/service that your customer picked at checkout.
    - `ship_by_date` (string, optional, example: "2024-08-28T21:00:33.000Z") — Target ship date
    - `created_at` (string, optional, example: "2024-09-20T16:48:32.000Z")
    - `updated_at` (string, optional, example: "2024-09-20T17:37:32.000Z")
    - `shipments` (array, optional) — If any of the items on the order have been shipped, by eHub or in the eCommerce system, this object will show you what objects have been shipped and any corresponding information we were able to find.

**Response Example**

```json
{
  "orders": [
    {
      "id": 1631844,
      "order_store_type": "custom",
      "order_store_id": 1245154,
      "order_store_name": "your_store_name",
      "order_id": 1631844,
      "external_id": "string",
      "order_number": "UA111111",
      "sub_order_count": "string",
      "order_date": "2024-08-28T21:00:33.000Z",
      "payment_status": "unpaid",
      "order_status": "active",
      "shipment_status": "pending",
      "items_total": "150.0",
      "tax_total": "string",
      "total": "150.0",
      "shipping_total": "string",
      "notes": "Provided note by partner software.",
      "tags": "tag1, tag2, tag3",
      "items": [
        {
          "id": 42623515,
          "item_id": "22222",
          "name": "Test Item Name Updated",
          "accounting_id": "string",
          "accounting_number": "string",
          "variant_name": "Blue / Large / New",
          "variant_id": "string",
          "variant_option1": "string",
          "variant_option2": "string",
          "variant_option3": "string",
          "image_src": "string",
          "external_id": "22222",
          "sku": "TEST-BLUE-L-NEW",
          "alt_external_id": "TEST-BLUE-L-NEW",
          "weight": 4,
          "length": "string",
          "width": "string",
          "height": "string",
          "quantity": "2.0",
          "price": "75.0",
          "cost": "150.0"
        }
      ],
      "billing_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "900 W Olympic Blvd",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90015",
        "phone": "0000000000",
        "email": "test_billing_email@test.com"
      },
      "shipping_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "1150 S Beverly Dr",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90035",
        "phone": "0000000000",
        "email": "test_shipping_email@test.com"
      },
      "external_customer_email": "test_customer_email@test.com",
      "external_customer_id": "HIJKMNL2515",
      "shipping_method": "Expedited",
      "ship_by_date": "2024-08-28T21:00:33.000Z",
      "created_at": "2024-09-20T16:48:32.000Z",
      "updated_at": "2024-09-20T17:37:32.000Z",
      "shipments": []
    }
  ]
}
```

---

## Retrieve an Order From an Order Store

**Source:** https://docs.ehub.com/order-stores/retrieve-an-order-from-an-order-store

### Endpoint

`GET /api/v2/order_stores/{order_store_id}/orders/{order_number}`

### Description

o retrieve a specific order from an **Order Store**, you can use the following endpoint by providing the **order_number**.

This endpoint will return detailed information about a single order from a specific order store.

### Path Parameters

- `order_store_id` (integer, required)
- `order_number` (string, required)

### Responses

#### Response 1 — `200`

Retrieve an Order From an Order Store

**Response Fields**

- `orders` (array, optional) — List of orders with any associated shipments
  - `0` (object, optional)
    - `id` (number, optional)
    - `order_store_type` (string, optional, example: "shopify")
    - `order_store_id` (number, optional, example: 9999999)
    - `order_store_name` (string, optional, example: "Test Shopify Store")
    - `order_id` (number, optional, example: 6235642003761) — The eCommerce system's designated order id
    - `external_id` (number, optional, example: 6235642003761)
    - `order_number` (string, optional, example: "91095") — The eCommerce system's user friendly order id
    - `sub_order_count` (number, optional, example: 1)
    - `order_date` (string, optional, example: "2024-08-30T08:40:51-04:00")
    - `payment_status` (string, optional, example: "paid")
    - `order_status` (string, optional, example: "active")
    - `shipment_status` (string, optional, example: "shipped")
    - `items_total` (string, optional, example: "132.0") — The total cost of all items on the order
    - `tax_total` (string, optional, example: "0.0") — The total tax amount for the order
    - `total` (string, optional, example: "132.0") — items_total + tax_total + shipping_total
    - `shipping_total` (number, optional) — The amount your system charged the end customer for shipping
    - `notes` (string, optional)
    - `tags` (string, optional) — Tags allow you to add specific indicators to orders. They can indicate which warehouse should fulfill the order, or if some special work is needed to process the order.
    - `items` (array, optional)
      - `0` (object, optional)
        - `id` (number, optional) — eHub's id for the item
        - `item_id` (number, optional, example: 15492571791665) — The eCommerce system's product/item id
        - `name` (string, optional, example: "Shoe - White / 8")
        - `accounting_id` (number, optional, example: 8224709280049)
        - `accounting_number` (number, optional, example: 8224709280049)
        - `variant_name` (string, optional, example: "White / 8")
        - `variant_id` (number, optional, example: 44545925087537) — The eCommerce system's id for the product's variant
        - `variant_option1` (string, optional)
        - `variant_option2` (string, optional)
        - `variant_option3` (string, optional)
        - `image_src` (string, optional) — A URL for the items image
        - `external_id` (number, optional, example: 15492571791665)
        - `sku` (string, optional, example: "white_8")
        - `alt_external_id` (string, optional, example: "white_8")
        - `weight` (number, optional, example: 16.01)
        - `length` (string, optional)
        - `width` (string, optional)
        - `height` (string, optional)
        - `quantity` (number, optional, example: 2) — How many were ordered
        - `price` (string, optional, example: "8.0") — The price of a single item
        - `cost` (string, optional, example: "16.0") — price * quantity
      - `1` (object, optional)
        - `id` (string, optional) — eHub's id for the item
        - `item_id` (number, optional, example: 15492571824433) — The eCommerce system's product/item id
        - `name` (string, optional, example: "Shoe - White / 9")
        - `accounting_id` (number, optional, example: 8214830022961)
        - `accounting_number` (number, optional, example: 8214830022961)
        - `variant_name` (string, optional, example: "White / 9")
        - `variant_id` (number, optional, example: 44512033145137) — The eCommerce system's id for the product's variant
        - `variant_option1` (string, optional)
        - `variant_option2` (string, optional)
        - `variant_option3` (string, optional)
        - `image_src` (string, optional) — A URL for the items image
        - `external_id` (number, optional, example: 15492571824433)
        - `sku` (string, optional, example: "WHITE-SHOE-2")
        - `alt_external_id` (string, optional, example: "WHITE-SHOE-2")
        - `weight` (number, optional, example: 16.01)
        - `length` (string, optional)
        - `width` (string, optional)
        - `height` (string, optional)
        - `quantity` (number, optional, example: 2) — How many were ordered
        - `price` (string, optional, example: "8.0") — The price of a single item
        - `cost` (string, optional, example: "16.0") — price * quantity
      - `2` (object, optional)
        - `id` (string, optional) — eHub's id for the item
        - `item_id` (number, optional, example: 15492571857201) — The eCommerce system's product/item id
        - `name` (string, optional, example: "Shoe Lace")
        - `accounting_id` (number, optional, example: 8214831563057)
        - `accounting_number` (number, optional, example: 8214831563057)
        - `variant_name` (string, optional)
        - `variant_id` (number, optional, example: 44512038027569) — The eCommerce system's id for the product's variant
        - `variant_option1` (string, optional)
        - `variant_option2` (string, optional)
        - `variant_option3` (string, optional)
        - `image_src` (string, optional) — A URL for the items image
        - `external_id` (number, optional, example: 15492571857201)
        - `sku` (string, optional, example: "SHOE-LACE")
        - `alt_external_id` (string, optional, example: "SHOE-LACE")
        - `weight` (number, optional, example: 2.01)
        - `length` (string, optional)
        - `width` (string, optional)
        - `height` (string, optional)
        - `quantity` (number, optional, example: 2) — How many were ordered
        - `price` (string, optional, example: "50.0") — The price of a single item
        - `cost` (string, optional, example: "100.0") — price * quantity
    - `billing_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "900 W Olympic Blvd")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90015")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_billing_email@test.com")
    - `shipping_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "1150 S Beverly Dr")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90035")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_shipping_email@test.com")
    - `external_customer_email` (string, optional)
    - `external_customer_id` (number, optional, example: 6888500166961) — The id for the customer in the eCommerce system
    - `shipping_method` (string, optional) — The shipping method/service that your customer picked at checkout.
    - `ship_by_date` (string, optional) — Target ship date
    - `created_at` (string, optional)
    - `updated_at` (string, optional, example: "2024-09-20T13:52:55-04:00")
    - `shipments` (array, optional)
      - `0` (object, optional) — If any of the items on the order have been shipped, by eHub or in the eCommerce system, this object will show you what objects have been shipped and any corresponding information we were able to find.
        - `id` (number, optional, example: 214513548) — eHub's shipment id
        - `external_id` (number, optional, example: 5501828497713) — The eCommerce system's shipment_id
        - `shipment_id` (number, optional, example: 5501828497713)
        - `carrier` (string, optional, example: "ups")
        - `service` (string, optional, example: "ups_ground")
        - `ship_date` (string, optional, example: "2024-09-20T13:52:55-04:00")
        - `tracking_number` (string, optional, example: "1234567891011")
        - `weight` (string, optional)
        - `shipping_cost` (string, optional)
        - `insurance_type` (string, optional)
        - `insurance_amount` (string, optional)
        - `parcels` (array, optional)
          - `0` (object, optional)
            - `id` (number, optional)
            - `external_shipment_id` (string, optional)
            - `external_id` (string, optional)
            - `ship_date` (string, optional, example: "2024-09-20T13:52:55-04:00")
            - `postage_label` (object, optional)
            - `status` (string, optional)
            - `length` (string, optional)
            - `width` (string, optional)
            - `height` (string, optional)
            - `weight` (string, optional)
            - `package_type` (string, optional)
            - `tracking_number` (string, optional, example: "1234567891011")
            - `shipping_cost` (string, optional)
            - `insurance_amount` (string, optional)
            - `parcel_items` (array, optional)
              - `0` (object, optional)
                - `id` (string, optional)
                - `item_id` (number, optional, example: 15492571791665)
                - `name` (string, optional, example: "Shoe - White / 8")
                - `accounting_id` (number, optional, example: 8224709280049)
                - `accounting_number` (number, optional, example: 8224709280049)
                - `variant_name` (string, optional, example: "White / 8")
                - `variant_id` (number, optional, example: 44545925087537)
                - `variant_option1` (string, optional)
                - `variant_option2` (string, optional)
                - `variant_option3` (string, optional)
                - `image_src` (string, optional)
                - `external_id` (number, optional, example: 15492571791665)
                - `sku` (string, optional, example: "white_8")
                - `alt_external_id` (string, optional, example: "white_8")
                - `weight` (number, optional, example: 16.01)
                - `length` (string, optional)
                - `width` (string, optional)
                - `height` (string, optional)
                - `quantity` (number, optional, example: 2)
                - `price` (string, optional, example: "8.0")
                - `cost` (string, optional, example: "16.0")
              - `1` (object, optional)
                - `id` (string, optional)
                - `item_id` (number, optional, example: 15492571824433)
                - `name` (string, optional, example: "Shoe - White / 9")
                - `accounting_id` (number, optional, example: 8214830022961)
                - `accounting_number` (number, optional, example: 8214830022961)
                - `variant_name` (string, optional, example: "White / 9")
                - `variant_id` (number, optional, example: 44512033145137)
                - `variant_option1` (string, optional)
                - `variant_option2` (string, optional)
                - `variant_option3` (string, optional)
                - `image_src` (string, optional)
                - `external_id` (number, optional, example: 15492571824433)
                - `sku` (string, optional, example: "WHITE-SHOE-2")
                - `alt_external_id` (string, optional, example: "WHITE-SHOE-2")
                - `weight` (number, optional, example: 16.01)
                - `length` (string, optional)
                - `width` (string, optional)
                - `height` (string, optional)
                - `quantity` (number, optional, example: 2)
                - `price` (string, optional, example: "8.0")
                - `cost` (string, optional, example: "16.0")
              - `2` (object, optional)
                - `id` (string, optional)
                - `item_id` (number, optional, example: 15492571857201)
                - `name` (string, optional, example: "Shoe Lace")
                - `accounting_id` (number, optional, example: 8214831563057)
                - `accounting_number` (number, optional, example: 8214831563057)
                - `variant_name` (string, optional)
                - `variant_id` (number, optional, example: 44512038027569)
                - `variant_option1` (string, optional)
                - `variant_option2` (string, optional)
                - `variant_option3` (string, optional)
                - `image_src` (string, optional)
                - `external_id` (number, optional, example: 15492571857201)
                - `sku` (string, optional, example: "SHOE-LACE")
                - `alt_external_id` (string, optional, example: "SHOE-LACE")
                - `weight` (number, optional, example: 2.01)
                - `length` (string, optional)
                - `width` (string, optional)
                - `height` (string, optional)
                - `quantity` (number, optional, example: 2)
                - `price` (string, optional, example: "50.0")
                - `cost` (string, optional, example: "100.0")
            - `created_at` (string, optional)
            - `updated_at` (string, optional)
        - `created_at` (string, optional, example: "2024-09-20T13:52:55-04:00")
        - `updated_at` (string, optional, example: "2024-09-20T13:52:55-04:00")

**Response Example**

```json
{
  "orders": [
    {
      "id": 0,
      "order_store_type": "shopify",
      "order_store_id": 9999999,
      "order_store_name": "Test Shopify Store",
      "order_id": 6235642003761,
      "external_id": 6235642003761,
      "order_number": "91095",
      "sub_order_count": 1,
      "order_date": "2024-08-30T08:40:51-04:00",
      "payment_status": "paid",
      "order_status": "active",
      "shipment_status": "shipped",
      "items_total": "132.0",
      "tax_total": "0.0",
      "total": "132.0",
      "shipping_total": 0,
      "notes": "string",
      "tags": "string",
      "items": [
        {
          "id": 0,
          "item_id": 15492571791665,
          "name": "Shoe - White / 8",
          "accounting_id": 8224709280049,
          "accounting_number": 8224709280049,
          "variant_name": "White / 8",
          "variant_id": 44545925087537,
          "variant_option1": "string",
          "variant_option2": "string",
          "variant_option3": "string",
          "image_src": "string",
          "external_id": 15492571791665,
          "sku": "white_8",
          "alt_external_id": "white_8",
          "weight": 16.01,
          "length": "string",
          "width": "string",
          "height": "string",
          "quantity": 2,
          "price": "8.0",
          "cost": "16.0"
        }
      ],
      "billing_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "900 W Olympic Blvd",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90015",
        "phone": "0000000000",
        "email": "test_billing_email@test.com"
      },
      "shipping_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "1150 S Beverly Dr",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90035",
        "phone": "0000000000",
        "email": "test_shipping_email@test.com"
      },
      "external_customer_email": "string",
      "external_customer_id": 6888500166961,
      "shipping_method": "string",
      "ship_by_date": "string",
      "created_at": "string",
      "updated_at": "2024-09-20T13:52:55-04:00",
      "shipments": [
        {
          "id": 214513548,
          "external_id": 5501828497713,
          "shipment_id": 5501828497713,
          "carrier": "ups",
          "service": "ups_ground",
          "ship_date": "2024-09-20T13:52:55-04:00",
          "tracking_number": "1234567891011",
          "weight": "string",
          "shipping_cost": "string",
          "insurance_type": "string",
          "insurance_amount": "string",
          "parcels": [
            {
              "id": 0,
              "external_shipment_id": "string",
              "external_id": "string",
              "ship_date": "2024-09-20T13:52:55-04:00",
              "postage_label": {},
              "status": "string",
              "length": "string",
              "width": "string",
              "height": "string",
              "weight": "string",
              "package_type": "string",
              "tracking_number": "1234567891011",
              "shipping_cost": "string",
              "insurance_amount": "string",
              "parcel_items": [
                {
                  "id": "string",
                  "item_id": 15492571791665,
                  "name": "Shoe - White / 8",
                  "accounting_id": 8224709280049,
                  "accounting_number": 8224709280049,
                  "variant_name": "White / 8",
                  "variant_id": 44545925087537,
                  "variant_option1": "string",
                  "variant_option2": "string",
                  "variant_option3": "string",
                  "image_src": "string",
                  "external_id": 15492571791665,
                  "sku": "white_8",
                  "alt_external_id": "white_8",
                  "weight": 16.01,
                  "length": "string",
                  "width": "string",
                  "height": "string",
                  "quantity": 2,
                  "price": "8.0",
                  "cost": "16.0"
                }
              ],
              "created_at": "string",
              "updated_at": "string"
            }
          ],
          "created_at": "2024-09-20T13:52:55-04:00",
          "updated_at": "2024-09-20T13:52:55-04:00"
        }
      ]
    }
  ]
}
```

---

## Ship an Order

**Source:** https://docs.ehub.com/order-stores/ship-an-order

### Endpoint

`POST /api/v2/order_stores/{order_store_id}/orders/{order_number}/shipments`

### Description

This endpoint allows you to mark an order as **shipped** or **fulfilled**. In some cases, depending on the integration with the eCommerce system, eHub can also upload the shipment information back to the order store.

Be sure to check the **Order Store** in the eHub portal to see if this functionality is supported for your specific integration.

### Path Parameters

- `order_store_id` (integer, required)
- `order_number` (string, required)

### Request Body Fields

- `shipping_cost` (number, required) — Shipping cost in US dollars/cents
- `ship_date` (string, required) — Date/Time of shipment
- `tracking_number` (string, required) — Shipment tracking number
- `carrier` (string, required, example: "4px") — Carrier used for shipment
- `service` (string, required, example: "collect_economy") — Service used for shipment
- `weight` (number, optional) — Weight of the entire package in ounces.
- `notify` (boolean, optional) — Indicates that e-commerce platform should send a shipment notification. Defaults to true

### Request Example

```json
{
  "shipping_cost": 0,
  "ship_date": "string",
  "tracking_number": "string",
  "carrier": "4px",
  "service": "collect_economy",
  "weight": 0,
  "notify": false
}
```

### Responses

#### Response 1 — `201`

Ship an Order

**Response Fields**

- `shipment` (object, optional) — Shipment object
  - `id` (number, optional, example: 154774714) — eHub's shipment id
  - `shipment_id` (number, optional, example: 5501828497713) — The eCommerce system's shipment id

**Response Example**

```json
{
  "shipment": {
    "id": 154774714,
    "shipment_id": 5501828497713
  }
}
```

---

## Cancel an Order's Shipment

**Source:** https://docs.ehub.com/order-stores/cancel-an-order-s-shipment

### Endpoint

`POST /api/v2/order_stores/{order_store_id}/orders/{order_number}/shipments/cancel`

### Description

This endpoint allows you to mark an order's shipment as **not shipped** or **unfulfilled**. For certain eCommerce integrations, eHub supports reversing the order's fulfillment status. Please check the **Order Store** in the eHub portal to confirm if this feature is available for your specific integration.

### Path Parameters

- `order_store_id` (integer, required)
- `order_number` (string, required)

### Responses

#### Response 1 — `201`

Cancel an Order's Shipment

**Response Fields**

- `shipment` (object, optional) — Shipment object
  - `id` (string, optional) — Shipment id
  - `shipment_id` (string, optional) — External shipment id

**Response Example**

```json
{
  "shipment": {
    "id": "string",
    "shipment_id": "string"
  }
}
```

---

## Create Custom Orders

**Source:** https://docs.ehub.com/order-stores/create-custom-orders

### Endpoint

`POST /api/v2/order_stores/{order_store_id}/orders`

### Description

The endpoint allows you to create orders saved to eHub’s database. This functionality is exclusively available for "Custom" order stores, meaning it is for use in situations where custom software or systems are integrated with eHub’s API. Before attempting to use this endpoint please ensure that you have created an order store in the eHub portal with the type, “Custom”.

Users can create custom orders, providing full order details, including billing, shipping, items, and shipment information, which will then be pushed to eHub's database for future use and reference.

### Path Parameters

- `order_store_id` (integer, required)

### Request Body Fields

- `orders` (array, optional)
  - `0` (object, optional)
    - `order_id` (string, optional, example: "111111") — Your systems designated order id
    - `order_number` (string, optional, example: "UA111111") — Your systems user friendly order id
    - `order_date` (string, optional, example: "2024-08-28T21:00:33.162Z") — date the order was placed
    - `payment_status` (string, optional, example: "unpaid")
    - `order_status` (string, optional, example: "active")
    - `shipment_status` (string, optional, example: "pending")
    - `items_total` (number, optional, example: 15) — The total cost of all items on the order
    - `tax_total` (number, optional) — The total tax amount for the order
    - `shipping_total` (number, optional) — The amount your system charged the end customer for shipping
    - `total` (number, optional, example: 15) — items_total + tax_total + shipping_total
    - `notes` (string, optional, example: "Provided note by partner software.")
    - `tags` (string, optional, example: "tag1, tag2, tag3") — Tags allow you to add specific indicators to orders. They can indicate which warehouse should fulfill the order, or if some special work is needed to process the order.
    - `items` (array, optional)
      - `0` (object, optional)
        - `item_id` (string, optional, example: "22222")
        - `name` (string, optional, example: "Test Item Name")
        - `accounting_id` (string, optional, example: "string")
        - `accounting_number` (string, optional, example: "string")
        - `variant_name` (string, optional, example: "Blue / Large / Used")
        - `external_id` (string, optional, example: "22222")
        - `alt_external_id` (string, optional, example: "TEST-BLUE-L-USED")
        - `sku` (string, optional, example: "TEST-BLUE-L-USED")
        - `weight` (number, optional, example: 4) — In ounces
        - `quantity` (number, optional, example: 2) — How many were ordered
        - `price` (number, optional, example: 7.5) — The price of a single item
        - `cost` (number, optional, example: 15) — price * quantity
    - `billing_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "900 W Olympic Blvd")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90015")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_billing_email@test.com")
    - `shipping_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "1150 S Beverly Dr")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90035")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_shipping_email@test.com")
    - `external_customer_email` (string, optional, example: "test_customer_eamil@test.com")
    - `external_customer_id` (string, optional, example: "HIJKMNL2515")
    - `shipping_method` (string, optional, example: "Expedited") — The shipping method/service that your customer picked at checkout, or your system designated based upon delivery windows.
    - `ship_by_date` (string, optional, example: "2024-08-28T21:00:33.162Z")

### Request Example

```json
{
  "orders": [
    {
      "order_id": "111111",
      "order_number": "UA111111",
      "order_date": "2024-08-28T21:00:33.162Z",
      "payment_status": "unpaid",
      "order_status": "active",
      "shipment_status": "pending",
      "items_total": 15,
      "tax_total": 0,
      "shipping_total": 0,
      "total": 15,
      "notes": "Provided note by partner software.",
      "tags": "tag1, tag2, tag3",
      "items": [
        {
          "item_id": "22222",
          "name": "Test Item Name",
          "accounting_id": "string",
          "accounting_number": "string",
          "variant_name": "Blue / Large / Used",
          "external_id": "22222",
          "alt_external_id": "TEST-BLUE-L-USED",
          "sku": "TEST-BLUE-L-USED",
          "weight": 4,
          "quantity": 2,
          "price": 7.5,
          "cost": 15
        }
      ],
      "billing_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "900 W Olympic Blvd",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90015",
        "phone": "0000000000",
        "email": "test_billing_email@test.com"
      },
      "shipping_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "1150 S Beverly Dr",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90035",
        "phone": "0000000000",
        "email": "test_shipping_email@test.com"
      },
      "external_customer_email": "test_customer_eamil@test.com",
      "external_customer_id": "HIJKMNL2515",
      "shipping_method": "Expedited",
      "ship_by_date": "2024-08-28T21:00:33.162Z"
    }
  ]
}
```

### Responses

#### Response 1 — `201`

Create Custom Orders

**Response Fields**

- `orders` (array, optional) — List of orders with any associated shipments
  - `0` (object, optional)
    - `id` (number, optional, example: 213548954)
    - `order_store_type` (string, optional, example: "custom")
    - `order_store_id` (string, optional, example: "your_store_id")
    - `order_store_name` (string, optional, example: "your_store_name")
    - `order_id` (string, optional, example: "111111")
    - `external_id` (string, optional, example: "111111")
    - `order_number` (string, optional, example: "UA111111")
    - `order_date` (string, optional, example: "2024-09-04T16:13:29.775Z")
    - `payment_status` (string, optional, example: "unpaid")
    - `order_status` (string, optional, example: "active")
    - `shipment_status` (string, optional, example: "partial")
    - `items_total` (number, optional, example: 15)
    - `tax_total` (number, optional)
    - `shipping_total` (number, optional)
    - `total` (number, optional, example: 15)
    - `notes` (string, optional, example: "Provided note by partner software.")
    - `tags` (string, optional, example: "tag1, tag2, tag3")
    - `items` (array, optional)
      - `0` (object, optional)
        - `item_id` (string, optional, example: "22222")
        - `name` (string, optional, example: "Test Item Name")
        - `accounting_id` (string, optional, example: "string")
        - `accounting_number` (string, optional, example: "string")
        - `variant_name` (string, optional, example: "Blue / Large / Used")
        - `external_id` (string, optional, example: "22222")
        - `alt_external_id` (string, optional, example: "TEST-BLUE-L-USED")
        - `sku` (string, optional, example: "TEST-BLUE-L-USED")
        - `weight` (number, optional, example: 4)
        - `quantity` (number, optional, example: 2)
        - `price` (number, optional, example: 7.5)
        - `cost` (number, optional, example: 15)
    - `billing_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "900 W Olympic Blvd")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90015")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_billing_email@test.com")
    - `shipping_address` (object, optional)
      - `company` (string, optional, example: "string")
      - `first_name` (string, optional, example: "Test")
      - `last_name` (string, optional, example: "Customer")
      - `address1` (string, optional, example: "1150 S Beverly Dr")
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional, example: "Los Angeles")
      - `state` (string, optional, example: "CA")
      - `country` (string, optional, example: "US")
      - `postal_code` (string, optional, example: "90035")
      - `phone` (string, optional, example: "0000000000")
      - `email` (string, optional, example: "test_shipping_email@test.com")
    - `external_customer_email` (string, optional, example: "string")
    - `external_customer_id` (string, optional, example: "string")
    - `shipping_method` (string, optional, example: "string")
    - `ship_by_date` (string, optional, example: "2024-09-04T16:13:29.775Z")
    - `created_at` (string, optional, example: "2024-09-04T16:13:29.775Z")
    - `updated_at` (string, optional, example: "2024-09-04T16:13:29.775Z")

**Response Example**

```json
{
  "orders": [
    {
      "id": 213548954,
      "order_store_type": "custom",
      "order_store_id": "your_store_id",
      "order_store_name": "your_store_name",
      "order_id": "111111",
      "external_id": "111111",
      "order_number": "UA111111",
      "order_date": "2024-09-04T16:13:29.775Z",
      "payment_status": "unpaid",
      "order_status": "active",
      "shipment_status": "partial",
      "items_total": 15,
      "tax_total": 0,
      "shipping_total": 0,
      "total": 15,
      "notes": "Provided note by partner software.",
      "tags": "tag1, tag2, tag3",
      "items": [
        {
          "item_id": "22222",
          "name": "Test Item Name",
          "accounting_id": "string",
          "accounting_number": "string",
          "variant_name": "Blue / Large / Used",
          "external_id": "22222",
          "alt_external_id": "TEST-BLUE-L-USED",
          "sku": "TEST-BLUE-L-USED",
          "weight": 4,
          "quantity": 2,
          "price": 7.5,
          "cost": 15
        }
      ],
      "billing_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "900 W Olympic Blvd",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90015",
        "phone": "0000000000",
        "email": "test_billing_email@test.com"
      },
      "shipping_address": {
        "company": "string",
        "first_name": "Test",
        "last_name": "Customer",
        "address1": "1150 S Beverly Dr",
        "address2": "string",
        "address3": "string",
        "city": "Los Angeles",
        "state": "CA",
        "country": "US",
        "postal_code": "90035",
        "phone": "0000000000",
        "email": "test_shipping_email@test.com"
      },
      "external_customer_email": "string",
      "external_customer_id": "string",
      "shipping_method": "string",
      "ship_by_date": "2024-09-04T16:13:29.775Z",
      "created_at": "2024-09-04T16:13:29.775Z",
      "updated_at": "2024-09-04T16:13:29.775Z"
    }
  ]
}
```

---

## Update a Custom Order

**Source:** https://docs.ehub.com/order-stores/update-a-custom-order

### Endpoint

`PUT /api/v2/order_stores/{order_store_id}/orders/{order_number}`

### Description

This endpoint allows you to update an order saved to eHub’s database, specifically for "Custom" order stores that were created using the POST endpoint. You must provide the `order_number` in your request URL to identify the order you wish to update.

You don’t need to provide all the order information when updating; you can include only the fields that need to be modified (e.g., payment status, order status).

### Updating Only `payment_status`:

```
{
    "order": {
        "payment_status": "paid"
    }
}
```

### Shipping a Custom Order

To mark an order as fulfilled or shipped in the system, use the Ship an Order endpoint. This allows for easy shipment processing and tracking integration.

**If you have any questions, feel free to reach out to support at ****support@ehub.com****.**

### Path Parameters

- `order_store_id` (integer, required)
- `order_number` (string, required)

### Request Body Fields

- `order` (object, optional) — Custom order information
  - `order_id` (string, optional, example: "111111") — Your systems designated order id
  - `order_number` (string, optional, example: "UA111111") — Your systems user friendly order id
  - `order_date` (string, optional, example: "2024-09-04T16:13:29.775Z") — Date/Time the order was placed
  - `payment_status` (string, optional, example: "unpaid")
  - `order_status` (string, optional, example: "active")
  - `shipment_status` (string, optional, example: "pending")
  - `items` (array, optional) — Items included in order
    - `0` (object, optional)
      - `item_id` (string, optional, example: "22222")
      - `name` (string, optional, example: "Test Item Name Updated")
      - `variant_name` (string, optional, example: "Blue / Large / New")
      - `image_src` (string, optional) — A URL for the items image
      - `external_id` (string, optional, example: "22222")
      - `sku` (string, optional, example: "TEST-BLUE-L-NEW")
      - `weight` (number, optional, example: 4) — In ounces
      - `quantity` (number, optional, example: 2) — How many were ordered
      - `price` (number, optional, example: 75) — The price of a single item
      - `cost` (number, optional, example: 150) — price * quantity
  - `billing_address` (object, optional) — Address order was billed to
    - `company` (string, optional, example: "string") — The company name of the addressee.
    - `first_name` (string, optional, example: "Test") — The first name of the addressee.
    - `last_name` (string, optional, example: "Customer") — The last name of the addressee.
    - `address1` (string, required, example: "900 W Olympic Blvd") — Line 1 of the address.
    - `address2` (string, optional) — Line 2 of the address.
    - `address3` (string, optional) — Line 3 of the address.
    - `city` (string, required, example: "Los Angeles") — City of the address.
    - `state` (string, required, example: "CA") — State of the address. Use only the 2 digit code.
    - `country` (string, required, example: "US") — Country of the address. Use only the 2 digit code.
    - `postal_code` (string, required, example: "90015") — Postal code of the address.
    - `phone` (string, optional, example: "0000000000") — Phone number of the address.
    - `email` (string, optional, example: "test_billing_email@test.com") — E-mail of the address.
  - `shipping_address` (object, optional) — Address to ship to
    - `company` (string, optional, example: "string") — The company name of the addressee.
    - `first_name` (string, optional, example: "Test") — The first name of the addressee.
    - `last_name` (string, optional, example: "Customer") — The last name of the addressee.
    - `address1` (string, required, example: "1150 S Beverly Dr") — Line 1 of the address.
    - `address2` (string, optional) — Line 2 of the address.
    - `address3` (string, optional) — Line 3 of the address.
    - `city` (string, required, example: "Los Angeles") — City of the address.
    - `state` (string, required, example: "CA") — State of the address. Use only the 2 digit code.
    - `country` (string, required, example: "US") — Country of the address. Use only the 2 digit code.
    - `postal_code` (string, required, example: "90035") — Postal code of the address.
    - `phone` (string, optional, example: "0000000000") — Phone number of the address.
    - `email` (string, optional, example: "test_shipping_email@test.com") — E-mail of the address.
  - `external_customer_email` (string, optional, example: "test_customer_email@test.com") — Customer email address from the external order store
  - `external_customer_id` (string, optional, example: "15154581") — The id for the customer in your system
  - `shipping_method` (string, optional, example: "Expedited") — The shipping method/service that your customer picked at checkout, or your system designated based upon delivery windows.
  - `ship_by_date` (string, optional, example: "2024-09-04T16:13:29.775Z") — Target ship date

### Request Example

```json
{
  "order": {
    "order_id": "111111",
    "order_number": "UA111111",
    "order_date": "2024-09-04T16:13:29.775Z",
    "payment_status": "unpaid",
    "order_status": "active",
    "shipment_status": "pending",
    "items": [
      {
        "item_id": "22222",
        "name": "Test Item Name Updated",
        "variant_name": "Blue / Large / New",
        "image_src": "string",
        "external_id": "22222",
        "sku": "TEST-BLUE-L-NEW",
        "weight": 4,
        "quantity": 2,
        "price": 75,
        "cost": 150
      }
    ],
    "billing_address": {
      "company": "string",
      "first_name": "Test",
      "last_name": "Customer",
      "address1": "900 W Olympic Blvd",
      "address2": "string",
      "address3": "string",
      "city": "Los Angeles",
      "state": "CA",
      "country": "US",
      "postal_code": "90015",
      "phone": "0000000000",
      "email": "test_billing_email@test.com"
    },
    "shipping_address": {
      "company": "string",
      "first_name": "Test",
      "last_name": "Customer",
      "address1": "1150 S Beverly Dr",
      "address2": "string",
      "address3": "string",
      "city": "Los Angeles",
      "state": "CA",
      "country": "US",
      "postal_code": "90035",
      "phone": "0000000000",
      "email": "test_shipping_email@test.com"
    },
    "external_customer_email": "test_customer_email@test.com",
    "external_customer_id": "15154581",
    "shipping_method": "Expedited",
    "ship_by_date": "2024-09-04T16:13:29.775Z"
  }
}
```

### Responses

#### Response 1 — `200`

Update a Custom Order

**Response Fields**

- `id` (number, optional, example: 1631844)
- `order_store_type` (string, optional, example: "custom")
- `order_store_id` (string, optional, example: "your_store_id")
- `order_store_name` (string, optional, example: "your_store_name")
- `order_id` (string, optional, example: "string")
- `external_id` (string, optional, example: "111111")
- `order_number` (string, optional, example: "string")
- `sub_order_count` (string, optional)
- `order_date` (string, optional, example: "2024-09-04T16:13:29.775Z")
- `payment_status` (string, optional, example: "unpaid")
- `order_status` (string, optional, example: "active")
- `shipment_status` (string, optional, example: "pending")
- `items_total` (string, optional) — The total cost of all items on the order
- `tax_total` (string, optional) — The total tax amount for the order
- `total` (string, optional) — items_total + tax_total + shipping_total
- `shipping_total` (string, optional) — The amount your system charged the end customer for shipping
- `notes` (string, optional)
- `tags` (string, optional) — Tags allow you to add specific indicators to orders. They can indicate which warehouse should fulfill the order, or if some special work is needed to process the order.
- `items` (array, optional)
  - `0` (object, optional)
    - `id` (string, optional)
    - `item_id` (string, optional, example: "22222")
    - `name` (string, optional, example: "Test Item Name Updated")
    - `accounting_id` (string, optional, example: "string")
    - `accounting_number` (string, optional, example: "string")
    - `variant_name` (string, optional, example: "Blue / Large / New")
    - `variant_id` (string, optional)
    - `variant_option1` (string, optional, example: "string")
    - `variant_option2` (string, optional, example: "string")
    - `variant_option3` (string, optional, example: "string")
    - `image_src` (string, optional, example: "string") — A URL for the items image
    - `external_id` (string, optional, example: "22222")
    - `sku` (string, optional, example: "TEST-BLUE-L-NEW")
    - `alt_external_id` (string, optional, example: "TEST-BLUE-L-NEW")
    - `weight` (number, optional, example: 4) — in ounces
    - `length` (string, optional) — in inches
    - `width` (string, optional) — in inches
    - `height` (string, optional) — in inches
    - `quantity` (number, optional, example: 2) — How many were ordered
    - `price` (number, optional, example: 75) — The price of a single item
    - `cost` (number, optional, example: 150) — price * quantity
- `billing_address` (object, optional)
  - `company` (string, optional, example: "string")
  - `first_name` (string, optional, example: "Test")
  - `last_name` (string, optional, example: "Customer")
  - `address1` (string, optional, example: "900 W Olympic Blvd")
  - `address2` (string, optional)
  - `address3` (string, optional)
  - `city` (string, optional, example: "Los Angeles")
  - `state` (string, optional, example: "CA")
  - `country` (string, optional, example: "US")
  - `postal_code` (string, optional, example: "90015")
  - `phone` (string, optional, example: "0000000000")
  - `email` (string, optional, example: "test_billing_email@test.com")
- `shipping_address` (object, optional)
  - `company` (string, optional, example: "string")
  - `first_name` (string, optional, example: "Test")
  - `last_name` (string, optional, example: "Customer")
  - `address1` (string, optional, example: "1150 S Beverly Dr")
  - `address2` (string, optional)
  - `address3` (string, optional)
  - `city` (string, optional, example: "Los Angeles")
  - `state` (string, optional, example: "CA")
  - `country` (string, optional, example: "US")
  - `postal_code` (string, optional, example: "90035")
  - `phone` (string, optional, example: "0000000000")
  - `email` (string, optional, example: "test_shipping_email@test.com")
- `external_customer_email` (string, optional, example: "test_customer_email@test.com")
- `external_customer_id` (string, optional, example: "15154581") — The id for the customer in your system
- `shipping_method` (string, optional, example: "Expedited") — The shipping method/service that your customer picked at checkout, or your system designated based upon delivery windows.
- `ship_by_date` (string, optional, example: "2024-09-04T16:13:29.775Z") — Target ship date
- `created_at` (string, optional, example: "2024-09-04T16:13:29.775Z")
- `updated_at` (string, optional, example: "2024-09-04T16:13:29.775Z")

**Response Example**

```json
{
  "id": 1631844,
  "order_store_type": "custom",
  "order_store_id": "your_store_id",
  "order_store_name": "your_store_name",
  "order_id": "string",
  "external_id": "111111",
  "order_number": "string",
  "sub_order_count": "string",
  "order_date": "2024-09-04T16:13:29.775Z",
  "payment_status": "unpaid",
  "order_status": "active",
  "shipment_status": "pending",
  "items_total": "string",
  "tax_total": "string",
  "total": "string",
  "shipping_total": "string",
  "notes": "string",
  "tags": "string",
  "items": [
    {
      "id": "string",
      "item_id": "22222",
      "name": "Test Item Name Updated",
      "accounting_id": "string",
      "accounting_number": "string",
      "variant_name": "Blue / Large / New",
      "variant_id": "string",
      "variant_option1": "string",
      "variant_option2": "string",
      "variant_option3": "string",
      "image_src": "string",
      "external_id": "22222",
      "sku": "TEST-BLUE-L-NEW",
      "alt_external_id": "TEST-BLUE-L-NEW",
      "weight": 4,
      "length": "string",
      "width": "string",
      "height": "string",
      "quantity": 2,
      "price": 75,
      "cost": 150
    }
  ],
  "billing_address": {
    "company": "string",
    "first_name": "Test",
    "last_name": "Customer",
    "address1": "900 W Olympic Blvd",
    "address2": "string",
    "address3": "string",
    "city": "Los Angeles",
    "state": "CA",
    "country": "US",
    "postal_code": "90015",
    "phone": "0000000000",
    "email": "test_billing_email@test.com"
  },
  "shipping_address": {
    "company": "string",
    "first_name": "Test",
    "last_name": "Customer",
    "address1": "1150 S Beverly Dr",
    "address2": "string",
    "address3": "string",
    "city": "Los Angeles",
    "state": "CA",
    "country": "US",
    "postal_code": "90035",
    "phone": "0000000000",
    "email": "test_shipping_email@test.com"
  },
  "external_customer_email": "test_customer_email@test.com",
  "external_customer_id": "15154581",
  "shipping_method": "Expedited",
  "ship_by_date": "2024-09-04T16:13:29.775Z",
  "created_at": "2024-09-04T16:13:29.775Z",
  "updated_at": "2024-09-04T16:13:29.775Z"
}
```

---

## Services

**Source:** https://docs.ehub.com/services

### Description

## 1. Provider/Service Information

When interacting with eHub’s shipment services, two primary fields are essential:

- **service_id**: An integer that helps identify the service and is required when creating a shipment.
- **package_type**: An array that lists the supported package types for each service. Use the `package_types[i].type` value when submitting requests to ensure you're selecting the correct package type.

Key Points:

- Some services include predefined package types (e.g., large envelope, parcel, letter, softpack).
- If no package types are listed for a service, it defaults to the "parcel" package type. This occurs for services like UPS Express and ExpressPlus.

## 2. USPS Zone Information: Find Zone Endpoint

The Find Zone endpoint helps retrieve USPS zone information based on the provided "to" and "from" postal codes. This is essential for determining the shipping zone for a specific USPS service depending on the origin and destination locations.

Key Points:

- You can retrieve zone information using postal codes.
- This helps optimize shipping decisions by determining the correct zone for your shipments.

**Example Parameters:**

- **from_zip**: Origin postal code.
- **to_zip**: Destination postal code.

---

## Retrieve Services

**Source:** https://docs.ehub.com/services/retrieve-services

### Endpoint

`GET /api/v2/services`

### Description

### Provider/Service Information

When interacting with eHub’s shipment services, the **service_id** and **package_type** fields are critical. These values help you identify the service and the types of packages supported. Below are key details on how to handle these fields.

### Key Fields in Response

- **service_id**: An integer used when creating a shipment.
- **package_type**: An array that lists supported package types for each service. Use the `package_types[i].type` value when submitting requests to ensure you use the correct package type.

```
{
  "services": [
    {
      "service_id": 683,
      "service": "First Class Mail",
      "service_code": "usps_first_class",
      "carrier_code": "usps",
      "category": "shipping",
      "package_types": [
        {
          "type": "large_envelope",
          "name": "LargeEnvelope"
        },
        {
          "type": "parcel",
          "name": "Parcel"
        },
        {
          "type": "letter",
          "name": "Letter"
        },
        {
          "type": "softpack",
          "name": "Softpack"
        }
      ],
      "sort_order": null
    }
  ]
}
```

### Services With No Listed Package Types

If you encounter services that don't have any package types listed, this means that the service defaults to the `"parcel"`  package type. This is typically observed in some shipping options like UPS Express or ExpressPlus.

```
{
      "service_id": 669,
      "service": "Express",
      "service_code": "ups_express",
      "carrier_code": "ups",
      "category": "shipping",
      "package_types": [],
      "sort_order": null
    },
    {
      "service_id": 670,
      "service": "ExpressPlus",
      "service_code": "ups_express_plus",
      "carrier_code": "ups",
      "category": "shipping",
      "package_types": [],
      "sort_order": null
    },
```

### Query Parameters

- `category` (string, optional, example: "ecommerce") — Service category code

### Responses

#### Response 1 — `200`

Retrieve Services

**Response Fields**

- `services` (array, optional) — Carrier services
  - `` (array, optional) — Carrier services
    - `service_id` (integer, optional) — Service unique identifier
    - `service` (string, optional) — Service name
    - `service_code` (string, optional) — Service code
    - `carrier_code` (string, optional) — Carrier code
    - `category` (string, optional) — Service category
    - `package_types` (array, optional) — Package types supported by service
      - `` (array, optional) — Package types supported by service
        - `type` (string, optional) — Package type code
        - `name` (string, optional) — Package type name
    - `sort_order` (number, optional) — Service sort order

**Response Example**

```json
{
  "services": [
    [
      0
    ]
  ]
}
```

---

## Find Zone

**Source:** https://docs.ehub.com/services/find-zone

### Endpoint

`GET /api/v2/services/{service_id}/zones`

### Description

The **Find Zone** endpoint allows you to retrieve USPS zone information by providing the **to** and **from** postal codes. This helps in identifying the shipping zone for a specific USPS service based on the locations involved.

### Path Parameters

- `service_id` (integer, required)

### Query Parameters

- `from_country` (string, required) — Country of the from location. Use only the 2 digit code
- `from_postal_codes` (string, required) — Postal codes for from locations (comma separated)
- `to_country` (string, required) — Country of the to location. Use only the 2 digit code
- `to_postal_code` (string, required) — Postal code for the to location

### Responses

#### Response 1 — `200`

Find Zone

**Response Fields**

- `zones` (array, optional) — Service zone
  - `` (array, optional) — Service zone
    - `postal_code` (string, optional) — From postal code
    - `zone` (string, optional) — Service zone

**Response Example**

```json
{
  "zones": [
    [
      "string"
    ]
  ]
}
```

---

## Status

**Source:** https://docs.ehub.com/status

### Description

This page provides information on how to retrieve the current status of USPS carrier services connected to your eHub account.

By using the provided endpoint, you can monitor the real-time status of USPS services, ensuring that your shipping operations remain efficient and uninterrupted.

This tool is essential for tracking USPS service availability, helping to address any potential issues promptly.

---

## Service Statuses

**Source:** https://docs.ehub.com/status/service-statuses

### Endpoint

`GET /api/v2/status`

### Description

To check the current status of USPS's connected carrier servic**es**, use this endpoint to retrieve real-time information about USPS services connected to your eHub account. This will allow you to monitor USPS service availability and ensure smooth shipping operations.

### Responses

#### Response 1 — `200`

Service Statuses

**Response Fields**

- `api_services` (array, optional) — API services
  - `0` (object, optional)
    - `api_service` (string, optional, example: "USPS rate services")
    - `api_service_code` (string, optional, example: "usps_rate")
    - `status` (string, optional, example: "online")
    - `scheduled_events` (array, optional)
  - `1` (object, optional)
    - `api_service` (string, optional, example: "USPS label services")
    - `api_service_code` (string, optional, example: "usps_label")
    - `status` (string, optional, example: "online")
    - `scheduled_events` (array, optional)
  - `2` (object, optional)
    - `api_service` (string, optional, example: "USPS manifest services")
    - `api_service_code` (string, optional, example: "usps_manifest")
    - `status` (string, optional, example: "online")
    - `scheduled_events` (array, optional)
  - `3` (object, optional)
    - `api_service` (string, optional, example: "USPS tracking services")
    - `api_service_code` (string, optional, example: "usps_tracking")
    - `status` (string, optional, example: "online")
    - `scheduled_events` (array, optional)
  - `4` (object, optional)
    - `api_service` (string, optional, example: "USPS pickup services")
    - `api_service_code` (string, optional, example: "usps_pickup")
    - `status` (string, optional, example: "online")
    - `scheduled_events` (array, optional)

**Response Example**

```json
{
  "api_services": [
    {
      "api_service": "USPS rate services",
      "api_service_code": "usps_rate",
      "status": "online",
      "scheduled_events": []
    }
  ]
}
```

---

## Reports

**Source:** https://docs.ehub.com/reports

### Description

eHub provides a suite of robust reporting tools designed to help you effectively monitor and manage your shipping activities. These reports offer insights into postage meter transactions, shipment adjustments, and potential discrepancies, providing the transparency needed for smooth and efficient shipping operations.

---

### **Available Reports:**

## **Meter Transactions**

Retrieve detailed information about your postage meter transactions, including purchases, usage, refunds, and current balances. This report ensures you maintain a close watch on your postage usage and balance for optimal financial management.

## **USPS Shipment Adjustments**

Track any discrepancies reported by USPS between the information provided during label creation and the physical package received. This report highlights adjustments made by USPS, whether they result in a refund or additional charge.

---

These reports are essential for maintaining accurate records of your postage usage and adjustments, ensuring transparency and efficiency in your shipping operations.

---

## Shipment Adjustments

**Source:** https://docs.ehub.com/reports/shipment-adjustments

### Endpoint

`GET /api/v2/reports/shipment_adjustments`

### Description

When the Post Office finds discrepancies in the information reported to them when generating the label and the physical package they received, they will create adjustments to refund or charge your meter. This report will show you the adjustments the USPS has reported for your shipments.

### Query Parameters

- `from_time` (string, optional) — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `to_time` (string, optional) — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `page` (integer, optional) — Page offset to fetch. 1 is default.
- `per_page` (integer, optional) — Number of results to return per page. 10000 is default.
- `include_children` (boolean, optional) — Include reports for child customers

### Responses

#### Response 1 — `200`

Shipment Adjustments

**Response Fields**

- `shipment_adjustments` (array, optional) — Shipment Adjustments
  - `0` (object, optional)
    - `adjustment_id` (number, optional)
    - `adjustment_created_at` (string, optional, example: "2024-09-04T16:13:29.827Z")
    - `external_id` (number, optional)
    - `customer_id` (number, optional)
    - `customer` (string, optional, example: "string")
    - `shipment_id` (number, optional)
    - `tracking_number` (string, optional, example: "string")
    - `shipped_at` (string, optional, example: "2024-09-04T16:13:29.827Z")
    - `from_country` (string, optional, example: "string")
    - `from_postal_code` (string, optional, example: "string")
    - `adj_from_postal_code` (string, optional, example: "string")
    - `to_country` (string, optional, example: "string")
    - `to_postal_code` (string, optional, example: "string")
    - `ship_service` (string, optional, example: "string")
    - `adj_service` (string, optional, example: "string")
    - `ship_package` (string, optional, example: "string")
    - `adj_package` (string, optional, example: "string")
    - `ship_weight` (string, optional, example: "string")
    - `adj_weight` (string, optional, example: "string")
    - `ship_length` (string, optional, example: "string")
    - `adj_length` (string, optional, example: "string")
    - `ship_width` (string, optional, example: "string")
    - `adj_width` (string, optional, example: "string")
    - `ship_height` (string, optional, example: "string")
    - `adj_height` (string, optional, example: "string")
    - `ship_meter_cost` (number, optional)
    - `adj_meter_cost` (number, optional)
    - `meter_adj` (number, optional)
    - `ship_rate_cost` (number, optional)
    - `adj_rate_cost` (number, optional)
    - `rate_adj` (number, optional)
    - `description` (string, optional, example: "string")

**Response Example**

```json
{
  "shipment_adjustments": [
    {
      "adjustment_id": 0,
      "adjustment_created_at": "2024-09-04T16:13:29.827Z",
      "external_id": 0,
      "customer_id": 0,
      "customer": "string",
      "shipment_id": 0,
      "tracking_number": "string",
      "shipped_at": "2024-09-04T16:13:29.827Z",
      "from_country": "string",
      "from_postal_code": "string",
      "adj_from_postal_code": "string",
      "to_country": "string",
      "to_postal_code": "string",
      "ship_service": "string",
      "adj_service": "string",
      "ship_package": "string",
      "adj_package": "string",
      "ship_weight": "string",
      "adj_weight": "string",
      "ship_length": "string",
      "adj_length": "string",
      "ship_width": "string",
      "adj_width": "string",
      "ship_height": "string",
      "adj_height": "string",
      "ship_meter_cost": 0,
      "adj_meter_cost": 0,
      "meter_adj": 0,
      "ship_rate_cost": 0,
      "adj_rate_cost": 0,
      "rate_adj": 0,
      "description": "string"
    }
  ]
}
```

---

## Meter Transactions

**Source:** https://docs.ehub.com/reports/meter-transactions

### Endpoint

`GET /api/v2/reports/meter_transaction`

### Description

This endpoint allows you to retrieve your postage meter activity for a specified period. You can use it to track postage purchases, usage, and refunds.

### Query Parameters

- `carrier_code` (string, optional) — Carrier code
- `service_code` (string, optional) — Service code
- `from_time` (string, optional) — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `to_time` (string, optional) — Date format YYYY-MM-DD hh:mm:ss p or DD-MM-YYYY hh:mm:ss p
- `page` (integer, optional) — Page offset to fetch. 1 is default.
- `per_page` (integer, optional) — Number of results to return per page. 10000 is default.
- `status` (string, optional, example: "all") — Filter meter transations based on shipments status. Defaults to all
- `include_children` (boolean, optional) — Include reports for child customers

### Responses

#### Response 1 — `200`

Meter Transactions

**Response Fields**

- `meter_transactions` (array, optional) — Meter Transactions
  - `0` (object, optional)
    - `customer_name` (string, optional, example: "string")
    - `customer_id` (number, optional, example: 8675309)
    - `transaction_date_time` (string, optional, example: "2024-08-26T14:50:51.000Z")
    - `transaction_type` (string, optional, example: "debit")
    - `amount` (number, optional, example: 5.86)
    - `tracking_numbers` (array, optional)
      - `0` (string, optional, example: "00000000000000000000")

**Response Example**

```json
{
  "meter_transactions": [
    {
      "customer_name": "string",
      "customer_id": 8675309,
      "transaction_date_time": "2024-08-26T14:50:51.000Z",
      "transaction_type": "debit",
      "amount": 5.86,
      "tracking_numbers": [
        "00000000000000000000"
      ]
    }
  ]
}
```

---

## Webhook Subscriptions

**Source:** https://docs.ehub.com/webhook-subscriptions

### Description

eHub allows you to subscribe to webhooks to receive real-time notifications about shipment tracking events and payment statuses. These webhooks ensure that you stay informed and can automate workflows based on the latest updates from your shipments and payments.

---

## **Subscription Types**

#### **Shipment Tracking**

- Subscribe to receive tracking events for all shipments created under a single eHub account. Each child account will need its own subscription for individual tracking updates.
- **Use Case**: Automate tracking updates, monitor shipment progress, and notify customers of delivery status in real time.

#### **Payment Status**

- Subscribe to receive updates on payment status for shipment transactions made through eHub. The webhook will notify you of accepted, rejected, and returned payments.
- **Use Case**: Track payment statuses, handle discrepancies, and efficiently manage refunds or payment issues.

---

## **Webhook Statuses**

Webhooks can return the following statuses:

- **active**: The webhook is functioning and sending notifications as expected.
- **error_disabled**: The webhook has been disabled due to multiple consecutive errors, such as timeouts or failed deliveries.

Note: After 5 consecutive failed responses from the receiving system the webhook will automatically be updated to have a disabled status.

---

## **Parameters in the Response**

- **error_count**: Number of errors received from the upstream source.
- **last_response_code**: The most recent HTTP status code from the upstream source.
- **last_response_message**: The message corresponding to the last HTTP status code.

---

## **Disabled Subscriptions**

If a webhook request times out (fails to receive a successful response within 30 seconds), it will be marked as disabled after consecutive failures. You can avoid this by saving the payload locally, responding with success, and then processing the payload asynchronously.

## Tracking Event payload example:

```
{
  "subscription_type": "shipment_tracking",
  "status": "active",
  "payload": [
    {
      "shipment_id": 115,
      "tracking_number": "9400109205328003425036",
      "tracking_event_id": 539,
      "parcel_id": 115,
      "code": "01",
      "secondary_code": "01",
      "description": "Delivered, In/At Mailbox",
      "event_timestamp": "2018-11-13T00:00:00.000Z",
      "city": "New Oceane",
      "state": "CA",
      "postal_code": "34668-2801",
      "country": "US"
    },
    {
      "shipment_id": 115,
      "tracking_number": "9400109205328003425036",
      "tracking_event_id": 540,
      "parcel_id": 115,
      "code": "OF",
      "secondary_code": null,
      "description": "Out for Delivery",
      "event_timestamp": "2018-11-12T19:00:24.000Z",
      "city": "Lake Jett",
      "state": "LA",
      "postal_code": "91251-7728",
      "country": "US"
    }
  ]
}
```

**`code`** and **`secondary_code`** vary by carrier. For USPS the codes are documented in Publication 199, Appendix G-4 (https://postalpro.usps.com/impbimplementationguide).

## Payment Status payload example:

```
{
  "subscription_type": "payment_status",
  "payload": [
    {
      "payment_method_id": 0,
      "payment_transaction_id": 0,
      "gateway_txn_reference": "string",
      "transaction_time": "2020-05-14T15:56:58.550Z",
      "amount": 0,
      "type": "string",
      "status": "string"
    }
  ]
}
```

By subscribing to webhooks, you gain visibility into important shipment and payment activities, enabling you to take immediate action as needed.

---

## List Subscriptions

**Source:** https://docs.ehub.com/webhook-subscriptions/list-subscriptions

### Endpoint

`GET /api/v2/subscriptions`

### Description

The **Retrieve All Subscriptions** endpoint allows you to fetch a list of all webhook subscriptions associated with your eHub account. This includes any active or disabled subscriptions for tracking events and payment status notifications.

### Query Parameters

- `subscription_type` (string, optional, example: "shipment_tracking") — Subscription type
- `status` (string, optional, example: "active") — Subscription status
- `page` (integer, optional) — Page offset to fetch. Default = 1
- `per_page` (integer, optional) — Number of results to return per page. Default = 100

### Responses

#### Response 1 — `200`

List Subscriptions

**Response Fields**

- `subscriptions` (array, optional) — Subscriptions
  - `0` (object, optional)
    - `id` (number, optional)
    - `subscription_type` (string, optional, example: "shipment_tracking")
    - `status` (string, optional, example: "active")
    - `url` (string, optional, example: "string")
    - `payload_format` (string, optional, example: "json")
    - `auth_type` (string, optional, example: "hmac")
    - `hmac_shared_secret` (string, optional, example: "string")
    - `last_pushed_at` (string, optional, example: "2024-09-04T16:13:29.879Z")
    - `last_pushed_id` (number, optional)
    - `error_count` (number, optional)
    - `last_response_code` (number, optional)
    - `last_response_message` (string, optional, example: "string")

**Response Example**

```json
{
  "subscriptions": [
    {
      "id": 0,
      "subscription_type": "shipment_tracking",
      "status": "active",
      "url": "string",
      "payload_format": "json",
      "auth_type": "hmac",
      "hmac_shared_secret": "string",
      "last_pushed_at": "2024-09-04T16:13:29.879Z",
      "last_pushed_id": 0,
      "error_count": 0,
      "last_response_code": 0,
      "last_response_message": "string"
    }
  ]
}
```

---

## Create a Subscription

**Source:** https://docs.ehub.com/webhook-subscriptions/create-a-subscription

### Endpoint

`POST /api/v2/subscriptions`

### Description

Create a webhook subscription.

The **Create a Subscription** endpoint allows you to set up webhooks to receive notifications about shipment tracking events or payment status updates. This ensures real-time communication between your eHub account and your system, keeping you informed about key events in your logistics operations.

### Request Body Fields

- `subscription_type` (string, required, example: "shipment_tracking") — Subscription type
- `status` (string, required, example: "active") — Subscription status. Events are delivered as soon as possible when status is active.
- `url` (string, required) — A secure (HTTPS) web address
- `payload_format` (string, required, example: "json") — Format of payloads.
- `auth_type` (string, required, example: "hmac") — Approach used for authenticating requests.
- `hmac_shared_secret` (string, optional) — Shared secret used to sign webhook payloads when auth_type is HMAC.
- `http_username` (string, optional) — Used for webhook calls when auth_type is HTTP_BASIC.
- `http_password` (string, optional) — Used for webhook calls when auth_type is HTTP_BASIC.

### Request Example

```json
{
  "subscription_type": "shipment_tracking",
  "status": "active",
  "url": "string",
  "payload_format": "json",
  "auth_type": "hmac",
  "hmac_shared_secret": "string",
  "http_username": "string",
  "http_password": "string"
}
```

### Responses

#### Response 1 — `201`

Create a Subscription

**Response Fields**

- `id` (integer, optional) — Subscription ID
- `subscription_type` (string, required, example: "shipment_tracking") — Subscription type
- `status` (string, required, example: "active") — Subscription status. Events are delivered as soon as possible when status is active.
- `url` (string, required) — A secure (HTTPS) web address
- `payload_format` (string, required, example: "json") — Format of payloads.
- `auth_type` (string, required, example: "hmac")
- `hmac_shared_secret` (string, optional)

**Response Example**

```json
{
  "id": 0,
  "subscription_type": "shipment_tracking",
  "status": "active",
  "url": "string",
  "payload_format": "json",
  "auth_type": "hmac",
  "hmac_shared_secret": "string"
}
```

---

## Update a Subscription

**Source:** https://docs.ehub.com/webhook-subscriptions/update-a-subscription

### Endpoint

`PUT /api/v2/subscriptions/{id}`

### Description

The **Update a Subscription** endpoint allows you to modify an existing webhook subscription. You can update details such as the callback URL, the types of events you're subscribed to, or the description of the subscription. This helps ensure your webhook remains aligned with your current operational needs.

This endpoint gives you flexibility to keep your webhook subscriptions up-to-date with your current needs, ensuring that your system stays in sync with real-time shipment or payment status updates.

### Path Parameters

- `id` (integer, required)

### Request Body Fields

- `rewind_to_date` (string, optional) — Resets the 'last pushed' pointer to the first entity on given date,                                   resulting in the subscription re-sending all entities created since then.                                   Maximum of 30 days in the past.

### Request Example

```json
{
  "rewind_to_date": "string"
}
```

### Responses

#### Response 1 — `200`

Update a Subscription

**Response Fields**

- `id` (integer, optional) — Subscription ID
- `subscription_type` (string, required, example: "shipment_tracking") — Subscription type
- `status` (string, required, example: "active") — Subscription status. Events are delivered as soon as possible when status is active.
- `url` (string, required) — A secure (HTTPS) web address
- `payload_format` (string, required, example: "json") — Format of payloads.
- `auth_type` (string, required, example: "hmac")
- `hmac_shared_secret` (string, optional)
- `last_pushed_at` (string, optional) — Time the last subscription push was performed
- `last_pushed_id` (integer, optional) — ID of the last pushed entity
- `error_count` (integer, optional) — Count of pushes resulting in error. Resets to zero on successful push.
- `last_response_code` (integer, optional) — HTTP status code last returned by URL
- `last_response_message` (string, optional) — Response message resulting from last push attempt.

**Response Example**

```json
{
  "id": 0,
  "subscription_type": "shipment_tracking",
  "status": "active",
  "url": "string",
  "payload_format": "json",
  "auth_type": "hmac",
  "hmac_shared_secret": "string",
  "last_pushed_at": "string",
  "last_pushed_id": 0,
  "error_count": 0,
  "last_response_code": 0,
  "last_response_message": "string"
}
```

---

## Retrieve a Subscription

**Source:** https://docs.ehub.com/webhook-subscriptions/retrieve-a-subscription

### Endpoint

`GET /api/v2/subscriptions/{id}`

### Description

The **Retrieve a Subscription** endpoint allows you to get detailed information about a specific subscription linked to your account. By using the subscription ID, you can look up details such as the subscription type, the callback URL, the status, and the events that the subscription is tracking.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Retrieve a Subscription

**Response Fields**

- `id` (integer, optional) — Subscription ID
- `subscription_type` (string, required, example: "shipment_tracking") — Subscription type
- `status` (string, required, example: "active") — Subscription status. Events are delivered as soon as possible when status is active.
- `url` (string, required) — A secure (HTTPS) web address
- `payload_format` (string, required, example: "json") — Format of payloads.
- `auth_type` (string, required, example: "hmac")
- `hmac_shared_secret` (string, optional)
- `last_pushed_at` (string, optional) — Time the last subscription push was performed
- `last_pushed_id` (integer, optional) — ID of the last pushed entity
- `error_count` (integer, optional) — Count of pushes resulting in error. Resets to zero on successful push.
- `last_response_code` (integer, optional) — HTTP status code last returned by URL
- `last_response_message` (string, optional) — Response message resulting from last push attempt.

**Response Example**

```json
{
  "id": 0,
  "subscription_type": "shipment_tracking",
  "status": "active",
  "url": "string",
  "payload_format": "json",
  "auth_type": "hmac",
  "hmac_shared_secret": "string",
  "last_pushed_at": "string",
  "last_pushed_id": 0,
  "error_count": 0,
  "last_response_code": 0,
  "last_response_message": "string"
}
```

---

## Delete a Subscription

**Source:** https://docs.ehub.com/webhook-subscriptions/delete-a-subscription

### Endpoint

`DELETE /api/v2/subscriptions/{id}`

### Description

The **Delete a Subscription** endpoint allows you to remove an existing subscription associated with your account. This action stops any further webhook notifications from being sent to the specified callback URL for that subscription.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `204`

Delete a Subscription

---

## Payment Methods

**Source:** https://docs.ehub.com/payment-methods

### Description

The payment method endpoints allow you to create, update, and view the payment methods associated with your account. You'll be able to see if any are set to expire and identify which one is the default payment method on file.

eHub provides a comprehensive set of endpoints to manage your payment methods efficiently. Whether you need to list all payment methods, create a new one, update existing details, retrieve specific information, or delete a payment method, these tools ensure smooth payment operations and financial management. Below are the key functionalities available for managing payment methods.

---

## Payment Methods Endpoints

# **List All Payment Methods**

Use this endpoint to retrieve a list of all payment methods associated with your eHub account. It provides details such as account numbers, billing information, payment types, and default status.

- **Method**: `GET /api/v2/payment_methods`
- **Use Case**: Quickly view and manage all the payment methods available under your account for review or updates.

## **Create a New Payment Method**

This endpoint allows you to add a new payment method to your eHub account. Specify billing location, account type, and other necessary details to integrate a new payment method.

- **Method**: `POST /api/v2/payment_methods`
- **Use Case**: Add a new credit card, ACH, or other payment method to your account to ensure uninterrupted payment processing.

## **Update a Payment Method**

If you need to modify details of an existing payment method, such as updating billing information or changing the default status, this endpoint allows you to update the necessary fields without recreating the payment method.

- ** Method**: `PUT /api/v2/payment_methods/{id}`
- **Use Case**: Keep your payment methods up-to-date, such as updating expiry dates or modifying billing addresses, without creating a new payment method.

## **Retrieve a Payment Method**

This endpoint allows you to retrieve detailed information for a specific payment method using its unique ID. It is useful when you need to review a specific account's details, such as payment type, billing location, or account number.

- **Method**: `GET /api/v2/payment_methods/{id}`
- **Use Case**: Get detailed information about a single payment method, such as verifying the billing address or checking the account number on file.

---

## Summary

The Payment Methods API gives you full control over managing the financial aspects of your eHub account, from adding new payment methods to updating or retrieving existing ones. By using these tools, you can ensure your payment processes are efficient, secure, and up-to-date.

---

## List Payment Methods

**Source:** https://docs.ehub.com/payment-methods/list-payment-methods

### Endpoint

`GET /api/v2/payment_methods`

### Description

This endpoint allows you to retrieve a list of all the payment methods associated with your eHub account. It provides a comprehensive view of each payment method's details, including account numbers, billing information, payment types, and default status.

### Responses

#### Response 1 — `200`

List Payment Methods

**Response Fields**

- `payment_methods` (array, optional) — Payment methods
  - `0` (object, optional)
    - `id` (number, optional, example: 99998)
    - `type` (string, optional, example: "cc")
    - `billing_location` (object, optional)
      - `external_id` (string, optional)
      - `company` (string, optional)
      - `first_name` (string, optional)
      - `last_name` (string, optional)
      - `nick_name` (string, optional)
      - `address1` (string, optional)
      - `address2` (string, optional)
      - `address3` (string, optional)
      - `city` (string, optional)
      - `state` (string, optional)
      - `country` (string, optional)
      - `postal_code` (string, optional)
      - `phone` (string, optional)
      - `email` (string, optional)
    - `account_number` (string, optional, example: "0000")
    - `brand` (string, optional, example: "amex")
    - `expiry_month` (number, optional, example: 12)
    - `expiry_year` (number, optional, example: 2035)
    - `default_payment_method` (boolean, optional, example: true)
  - `1` (object, optional)
    - `id` (number, optional, example: 99999)
    - `type` (string, optional, example: "ach")
    - `billing_location` (string, optional)
    - `account_number` (string, optional, example: "0000")
    - `brand` (string, optional, example: "National Test Bank")
    - `expiry_month` (string, optional)
    - `expiry_year` (string, optional)
    - `default_payment_method` (boolean, optional, example: false)

**Response Example**

```json
{
  "payment_methods": [
    {
      "id": 99998,
      "type": "cc",
      "billing_location": {
        "external_id": "string",
        "company": "string",
        "first_name": "string",
        "last_name": "string",
        "nick_name": "string",
        "address1": "string",
        "address2": "string",
        "address3": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postal_code": "string",
        "phone": "string",
        "email": "string"
      },
      "account_number": "0000",
      "brand": "amex",
      "expiry_month": 12,
      "expiry_year": 2035,
      "default_payment_method": true
    }
  ]
}
```

---

## Create a New Payment Method

**Source:** https://docs.ehub.com/payment-methods/create-a-new-payment-method

### Endpoint

`POST /api/v2/payment_methods`

### Description

The **Create a New Payment Method** endpoint enables you to securely add a new payment method to your eHub account. This allows for flexibility in managing various payment methods such as ACH or credit cards, ensuring smooth transactions and payment processing for your shipments.

### Request Body Fields

- `payment_method` (object, optional) — Payment method
  - `type` (string, optional, example: "ach") — Type of payment method
  - `name` (string, optional) — Account holder full name
  - `bank_name` (string, optional) — Bank name (only applies to ACH payment methods
  - `bank_account_type` (string, optional, example: "checking") — Bank account type (only applies to ACH payment methods
  - `account_holder_type` (string, optional, example: "business") — Bank account holder type (only applies to ACH payment methods
  - `routing_number` (string, optional) — Routing number (only applies to ACH payment methods
  - `account_number` (string, optional) — Account number
  - `expiry` (string, optional) — Card Expiration: MMYY
  - `verification_code` (string, optional) — Verification code (only applies to credit cards)
  - `billing_location` (object, optional) — Payment method billing Location (only applies to credit cards)
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
  - `default_payment_method` (boolean, optional, example: false) — Make the payment method the default

### Request Example

```json
{
  "payment_method": {
    "type": "ach",
    "name": "string",
    "bank_name": "string",
    "bank_account_type": "checking",
    "account_holder_type": "business",
    "routing_number": "string",
    "account_number": "string",
    "expiry": "string",
    "verification_code": "string",
    "billing_location": {
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string"
    },
    "default_payment_method": false
  }
}
```

### Responses

#### Response 1 — `201`

Create a New Payment Method

**Response Fields**

- `payment_method` (object, optional) — Payment method
  - `id` (integer, optional) — Payment method id
  - `type` (string, optional, example: "ach") — Type of payment method
  - `billing_location` (object, optional) — Payment method billing Location
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `account_number` (string, optional) — Last 4 digits of account number
  - `brand` (string, optional) — Card or account type
  - `expiry_month` (integer, optional) — Expiration month
  - `expiry_year` (integer, optional) — Expiration year
  - `default_payment_method` (boolean, optional) — Indicates that the payment method is the default

**Response Example**

```json
{
  "payment_method": {
    "id": 0,
    "type": "ach",
    "billing_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "account_number": "string",
    "brand": "string",
    "expiry_month": 0,
    "expiry_year": 0,
    "default_payment_method": false
  }
}
```

---

## Update a Payment Method

**Source:** https://docs.ehub.com/payment-methods/update-a-payment-method

### Endpoint

`PUT /api/v2/payment_methods/{id}`

### Description

The t.

With the **Update a Payment Method** endpoint, you have the flexibility to modify an existing payment method within your eHub account. Whether you're updating billing information, adjusting account details, or designating a new default payment method, this endpoint ensures smooth updates with minimal effort.

### Path Parameters

- `id` (integer, required)

### Request Body Fields

- `payment_method` (object, optional) — Payment method
  - `default_payment_method` (boolean, optional) — Indicates that the payment method is the default

### Request Example

```json
{
  "payment_method": {
    "default_payment_method": false
  }
}
```

### Responses

#### Response 1 — `200`

Update a Payment Method

**Response Fields**

- `payment_method` (object, optional) — Payment method
  - `id` (integer, optional) — Payment method id
  - `type` (string, optional, example: "ach") — Type of payment method
  - `billing_location` (object, optional) — Payment method billing Location
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `account_number` (string, optional) — Last 4 digits of account number
  - `brand` (string, optional) — Card or account type
  - `expiry_month` (integer, optional) — Expiration month
  - `expiry_year` (integer, optional) — Expiration year
  - `default_payment_method` (boolean, optional) — Indicates that the payment method is the default

**Response Example**

```json
{
  "payment_method": {
    "id": 0,
    "type": "ach",
    "billing_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "account_number": "string",
    "brand": "string",
    "expiry_month": 0,
    "expiry_year": 0,
    "default_payment_method": false
  }
}
```

---

## Retrieve a Payment Method

**Source:** https://docs.ehub.com/payment-methods/retrieve-a-payment-method

### Endpoint

`GET /api/v2/payment_methods/{id}`

### Description

The **Retrieve a Payment Method** endpoint allows you to access detailed information about a specific payment method saved to your eHub account.

This can be used to check the details of a payment method, such as account number, billing information, and whether it is the default payment method.

### Path Parameters

- `id` (integer, required)

### Responses

#### Response 1 — `200`

Retrieve a Payment Method

**Response Fields**

- `payment_method` (object, optional) — Payment method
  - `id` (integer, optional) — Payment method id
  - `type` (string, optional, example: "ach") — Type of payment method
  - `billing_location` (object, optional) — Payment method billing Location
    - `external_id` (string, optional) — Address external id
    - `company` (string, optional) — The company of the addressee
    - `first_name` (string, optional) — The first name of the addressee
    - `last_name` (string, optional) — The last name of the addressee
    - `nick_name` (string, optional) — The nick name of the address
    - `address1` (string, required) — Line 1 of the address
    - `address2` (string, optional) — Line 2 of the address
    - `address3` (string, optional) — Line 3 of the address
    - `city` (string, required) — City of the address
    - `state` (string, required) — State of the address. Use only the 2 digit code
    - `country` (string, required) — Country of the address. Use only the 2 digit code
    - `postal_code` (string, required) — Postal code of the address
    - `phone` (string, optional) — Phone of the address
    - `email` (string, optional) — E-mail of the address
  - `account_number` (string, optional) — Last 4 digits of account number
  - `brand` (string, optional) — Card or account type
  - `expiry_month` (integer, optional) — Expiration month
  - `expiry_year` (integer, optional) — Expiration year
  - `default_payment_method` (boolean, optional) — Indicates that the payment method is the default

**Response Example**

```json
{
  "payment_method": {
    "id": 0,
    "type": "ach",
    "billing_location": {
      "external_id": "string",
      "company": "string",
      "first_name": "string",
      "last_name": "string",
      "nick_name": "string",
      "address1": "string",
      "address2": "string",
      "address3": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postal_code": "string",
      "phone": "string",
      "email": "string"
    },
    "account_number": "string",
    "brand": "string",
    "expiry_month": 0,
    "expiry_year": 0,
    "default_payment_method": false
  }
}
```

---

## Customers

**Source:** https://docs.ehub.com/customers

### Description

eHub's customer management functionality provides robust tools for creating, updating, and managing customer accounts. This suite of features is essential for businesses that need to oversee multiple child accounts or customers within their eHub platform. Here’s an overview of what you can accomplish using the customer management endpoints:

---

## **List Child Accounts**

- **Purpose**: Retrieve a list of all child accounts associated with your eHub account. This is particularly useful for businesses that manage multiple sub-accounts or clients.
- **Usage**: Use this endpoint to get a comprehensive view of all your connected child accounts, including their account details and current status.

---

## **Get a Single Child Account**

- **Purpose**: Retrieve detailed information for a specific child account. This endpoint is essential for viewing individual customer account details, including payment and billing information.
- **Usage**: Use this endpoint to access all relevant information for a particular customer or sub-account when performing audits or account management.

---

## Key Features:

- **User Management**: Create and manage users associated with customer accounts, including roles and access levels.
- **Payment and Billing**: Manage payment methods, view outstanding balances, and update billing information directly within the platform.
- **Flexible Updates**: Update only the necessary fields when modifying customer information, allowing for efficient and flexible account management.

---

This suite of endpoints is designed to streamline the process of managing customers and sub-accounts, ensuring that all aspects of customer management—from creation to ongoing updates—are handled seamlessly within the eHub platform. Whether you’re onboarding new clients or maintaining existing relationships, these tools provide the functionality you need to succeed.

---

## List Customers

**Source:** https://docs.ehub.com/customers/list-customers

### Endpoint

`GET /api/v2/customers`

### Description

This endpoint allows you to retrieve a list of all child accounts associated with your eHub account. This is particularly useful for managing multiple sub-accounts under a parent account, enabling you to monitor and control shipping activities across different user groups.

### Query Parameters

- `ids` (string, optional) — Customer ID or comma-separated list of customer IDs. If IDs is empty, all customers are returned.

### Responses

#### Response 1 — `200`

List Customers

**Response Fields**

- `customers` (array, optional) — Customers
  - `` (array, optional) — Customers
    - `id` (integer, required) — Customer ID
    - `parent_id` (integer, optional) — Parent customer ID
    - `external_id` (string, optional) — Customer external ID
    - `customer_template_id` (integer, optional) — Customer template ID
    - `name` (string, optional) — Customer name
    - `phone` (string, optional) — Customer phone
    - `email` (string, optional) — Customer E-mail
    - `user` (object, optional)
      - `id` (integer, required) — User ID
      - `first_name` (string, optional) — User first name
      - `last_name` (string, optional) — User last name
      - `phone` (string, optional) — User phone
      - `email` (string, optional) — User E-mail
      - `api_key` (string, optional) — User API key
    - `template_data` (object, optional)
      - `ehub_api_key` (string, optional) — Ehub API key
      - `payment_api_key` (string, optional) — Payment API key
      - `shipper_id` (string, optional) — Shipper id
      - `shipping_platform_id` (string, optional) — Shipping Platform Id
      - `usps_reference_code` (string, optional) — USPS Reference Code
      - `accounting_contact` (object, optional) — Customer contact name
        - `accounting_first_name` (string, optional) — Accounting First Name
        - `accounting_last_name` (string, optional) — Accounting Last Name
        - `accounting_email` (string, optional) — Accounting Email
        - `contact_type` (string, optional) — Contact Type
      - `payment` (object, optional) — Payment
        - `refill_trigger_balance` (number, optional) — Meter auto-refill is triggered when meter balance falls below this amount. Leave empty to disable meter auto-refill.
        - `refill_amount` (number, optional) — The amount of money that auto-refill should add to the meter. Leave empty to disable meter auto-refill.
        - `payment_method` (object, optional) — Payment method details used to fund the meter.
          - `account_type` (string, required) — CC or ACH
          - `routing_number` (string, optional) — Routing (ABA) number. Required for ACH
          - `number` (string, required) — Account number
          - `first_name` (string, required) — Account holder's first name
          - `last_name` (string, required) — Account holder's last name
          - `month` (integer, optional) — Credit card expiration month
          - `year` (integer, optional) — Credit card expiration year
          - `verification_value` (integer, optional) — Credit card security code (CVV)

**Response Example**

```json
{
  "customers": [
    [
      0
    ]
  ]
}
```

---

## Retrieve a Customer

**Source:** https://docs.ehub.com/customers/retrieve-a-customer

### Endpoint

`GET /api/v2/customers/{id}`

### Description

This endpoint allows you to retrieve detailed information for a specific child account connected to your parent eHub account.

### Path Parameters

- `id` (integer, required) — Customer ID

### Responses

#### Response 1 — `200`

Get a Customer

**Response Fields**

- `id` (integer, required) — Customer ID
- `parent_id` (integer, optional) — Parent customer ID
- `external_id` (string, optional) — Customer external ID
- `customer_template_id` (integer, optional) — Customer template ID
- `name` (string, optional) — Customer name
- `phone` (string, optional) — Customer phone
- `email` (string, optional) — Customer E-mail
- `user` (object, optional)
  - `id` (integer, required) — User ID
  - `first_name` (string, optional) — User first name
  - `last_name` (string, optional) — User last name
  - `phone` (string, optional) — User phone
  - `email` (string, optional) — User E-mail
  - `api_key` (string, optional) — User API key
- `template_data` (object, optional)
  - `ehub_api_key` (string, optional) — Ehub API key
  - `payment_api_key` (string, optional) — Payment API key
  - `shipper_id` (string, optional) — Shipper id
  - `shipping_platform_id` (string, optional) — Shipping Platform Id
  - `usps_reference_code` (string, optional) — USPS Reference Code
  - `accounting_contact` (object, optional) — Customer contact name
    - `accounting_first_name` (string, optional) — Accounting First Name
    - `accounting_last_name` (string, optional) — Accounting Last Name
    - `accounting_email` (string, optional) — Accounting Email
    - `contact_type` (string, optional) — Contact Type
  - `payment` (object, optional) — Payment
    - `refill_trigger_balance` (number, optional) — Meter auto-refill is triggered when meter balance falls below this amount. Leave empty to disable meter auto-refill.
    - `refill_amount` (number, optional) — The amount of money that auto-refill should add to the meter. Leave empty to disable meter auto-refill.
    - `payment_method` (object, optional) — Payment method details used to fund the meter.
      - `account_type` (string, required) — CC or ACH
      - `routing_number` (string, optional) — Routing (ABA) number. Required for ACH
      - `number` (string, required) — Account number
      - `first_name` (string, required) — Account holder's first name
      - `last_name` (string, required) — Account holder's last name
      - `month` (integer, optional) — Credit card expiration month
      - `year` (integer, optional) — Credit card expiration year
      - `verification_value` (integer, optional) — Credit card security code (CVV)

**Response Example**

```json
{
  "id": 0,
  "parent_id": 0,
  "external_id": "string",
  "customer_template_id": 0,
  "name": "string",
  "phone": "string",
  "email": "string",
  "user": {
    "id": 0,
    "first_name": "string",
    "last_name": "string",
    "phone": "string",
    "email": "string",
    "api_key": "string"
  },
  "template_data": {
    "ehub_api_key": "string",
    "payment_api_key": "string",
    "shipper_id": "string",
    "shipping_platform_id": "string",
    "usps_reference_code": "string",
    "accounting_contact": {
      "accounting_first_name": "string",
      "accounting_last_name": "string",
      "accounting_email": "string",
      "contact_type": "string"
    },
    "payment": {
      "refill_trigger_balance": 0,
      "refill_amount": 0,
      "payment_method": {
        "account_type": "string",
        "routing_number": "string",
        "number": "string",
        "first_name": "string",
        "last_name": "string",
        "month": 0,
        "year": 0,
        "verification_value": 0
      }
    }
  }
}
```

---
