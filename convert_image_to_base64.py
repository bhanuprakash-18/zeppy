import base64

def convert_image_to_base64(image_path, output_file):
    """Convert an image to base64 and save it to a text file."""
    try:
        with open(image_path, 'rb') as image_file:
            # Read the image file
            image_data = image_file.read()
            
            # Convert to base64
            base64_string = base64.b64encode(image_data).decode('utf-8')
            
            # Create the data URL format
            # Assuming JPEG format based on the file extension
            data_url = f"data:image/jpeg;base64,{base64_string}"
            
            # Write to output file
            with open(output_file, 'w') as output:
                output.write(data_url)
            
            print(f"Successfully converted {image_path} to base64")
            print(f"Base64 data saved to {output_file}")
            print(f"Data URL length: {len(data_url)} characters")
            
    except Exception as e:
        print(f"Error converting image: {e}")

if __name__ == "__main__":
    image_path = "data/578d5383-ded9-4eb3-a642-bd980ce2a0ae.jpeg"
    output_file = "zeppy_base64.txt"
    
    convert_image_to_base64(image_path, output_file)
