
import { Card, CardContent } from "@/components/ui/card";

const TestimonialsSection = () => {
  const testimonials = [{
    quote: "ConnectorAI helped me land interviews at 3 different companies after months of silence. The personalized outreach messages made all the difference.",
    author: "Sarah J., Product Manager",
    image: "https://placehold.co/100x100/9b87f5/white?text=SJ"
  }, {
    quote: "I used to dread networking, but the AI made it so much easier to craft messages that didn't feel awkward or pushy. Game changer!",
    author: "Michael T., Software Developer",
    image: "https://placehold.co/100x100/9b87f5/white?text=MT"
  }, {
    quote: "The tracking system is fantastic - I was able to manage dozens of connections without dropping the ball on follow-ups. Highly recommend!",
    author: "Priya N., Marketing Specialist",
    image: "https://placehold.co/100x100/9b87f5/white?text=PN"
  }];
  
  return (
    <section id="testimonials" className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">What Our Users Say</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 pb-6 flex flex-col items-center text-center">
                <div className="mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.author} 
                    className="w-16 h-16 rounded-full"
                  />
                </div>
                <p className="mb-4 italic text-gray-600">"{testimonial.quote}"</p>
                <p className="font-medium text-gray-800">{testimonial.author}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
